package controller

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/i18n"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

// exportableModels defines the ordered list of models for backup/restore.
// Order follows foreign-key dependency (parents before children).
type exportableModelDef struct {
	Model any
	Name  string
}

var exportableModels = []exportableModelDef{
	{&model.User{}, "users"},
	{&model.PasskeyCredential{}, "passkey_credentials"},
	{&model.Option{}, "options"},
	{&model.Redemption{}, "redemptions"},
	{&model.Ability{}, "abilities"},
	{&model.Midjourney{}, "midjourneys"},
	{&model.TopUp{}, "topups"},
	{&model.QuotaData{}, "quota_data"},
	{&model.Task{}, "tasks"},
	{&model.Model{}, "models"},
	{&model.Vendor{}, "vendors"},
	{&model.PrefillGroup{}, "prefill_groups"},
	{&model.Setup{}, "setup"},
	{&model.TwoFA{}, "two_fa"},
	{&model.TwoFABackupCode{}, "two_fa_backup_codes"},
	{&model.Checkin{}, "checkins"},
	{&model.SubscriptionOrder{}, "subscription_orders"},
	{&model.UserSubscription{}, "user_subscriptions"},
	{&model.SubscriptionPreConsumeRecord{}, "subscription_pre_consume_records"},
	{&model.CustomOAuthProvider{}, "custom_oauth_providers"},
	{&model.UserOAuthBinding{}, "user_oauth_bindings"},
	{&model.PerfMetric{}, "perf_metrics"},
	{&model.SystemInstance{}, "system_instances"},
	{&model.SystemTask{}, "system_tasks"},
	{&model.SystemTaskLock{}, "system_task_locks"},
	{&model.CasbinRule{}, "casbin_rules"},
	{&model.AuthzRole{}, "authz_roles"},
	{&model.InvitationCode{}, "invitation_codes"},
	{&model.Log{}, "logs"},
}

type BackupData struct {
	Version    int                `json:"version"`
	ExportedAt int64              `json:"exported_at"`
	Tables     map[string][]byte  `json:"tables"`
}

type BackupRestoreRequest struct {
	Data BackupData `json:"data"`
}

// ExportBackup exports all tables as a JSON file download. Root only.
func ExportBackup(c *gin.Context) {
	ctx := c.Request.Context()
	out := BackupData{
		Version:    1,
		ExportedAt: time.Now().Unix(),
		Tables:     make(map[string][]byte),
	}
	for _, entry := range exportableModels {
		var items []map[string]any
		if err := model.DB.WithContext(ctx).Model(entry.Model).Find(&items).Error; err != nil {
			common.SysLog(fmt.Sprintf("backup export: table %s query failed: %v", entry.Name, err))
			common.ApiErrorI18n(c, i18n.MsgDatabaseError)
			return
		}
		raw, _ := common.Marshal(items)
		out.Tables[entry.Name] = raw
	}
	payload, err := common.Marshal(out)
	if err != nil {
		common.SysLog(fmt.Sprintf("backup export: marshal failed: %v", err))
		common.ApiErrorI18n(c, i18n.MsgDatabaseError)
		return
	}
	filename := fmt.Sprintf("backup_%d.json", out.ExportedAt)
	c.Header("Content-Type", "application/json")
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Content-Length", strconv.Itoa(len(payload)))
	c.Data(http.StatusOK, "application/json", payload)
}

// RestoreBackup restores tables from a JSON backup. Only allowed before setup (constant.Setup == false).
func RestoreBackup(c *gin.Context) {
	if constant.Setup {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "系统已初始化，无法恢复备份"})
		return
	}
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "请选择备份文件"})
		return
	}
	f, err := file.Open()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "打开文件失败"})
		return
	}
	defer f.Close()
	body, err := io.ReadAll(f)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "读取文件失败"})
		return
	}
	var req BackupRestoreRequest
	if err := common.Unmarshal(body, &req); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "备份文件格式错误"})
		return
	}
	if req.Data.Version != 1 {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "不支持的备份版本"})
		return
	}
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Minute)
	defer cancel()
	if err := restoreTables(ctx, req.Data.Tables); err != nil {
		common.SysLog(fmt.Sprintf("backup restore failed: %v", err))
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "恢复失败: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "备份恢复成功"})
}

func restoreTables(ctx context.Context, tables map[string][]byte) error {
	for _, entry := range exportableModels {
		name := entry.Name
		raw, ok := tables[name]
		if !ok || len(bytes.TrimSpace(raw)) == 0 {
			continue
		}
		var items []map[string]any
		if err := common.Unmarshal(raw, &items); err != nil || len(items) == 0 {
			common.SysLog(fmt.Sprintf("backup restore: skip table %s, %v", name, err))
			continue
		}
		batchSize := 500
		for i := 0; i < len(items); i += batchSize {
			end := i + batchSize
			if end > len(items) {
				end = len(items)
			}
			batch := items[i:end]
			if err := model.DB.WithContext(ctx).Model(entry.Model).CreateInBatches(batch, batchSize).Error; err != nil {
				return fmt.Errorf("table %s batch insert failed at offset %d: %w", name, i, err)
			}
		}
	}
	return nil
}

// StartLogAutoCleanup starts a daily ticker that auto-deletes old logs.
func StartLogAutoCleanup() {
	go func() {
		enabled := common.GetEnvOrDefaultBool("LOG_AUTO_CLEANUP", true)
		days := common.GetEnvOrDefault("LOG_AUTO_CLEANUP_DAYS", 30)
		if !enabled || days <= 0 {
			return
		}
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()
		runLogCleanup(days)
		for range ticker.C {
			runLogCleanup(days)
		}
	}()
}

func runLogCleanup(days int) {
	ctx := context.Background()
	target := time.Now().AddDate(0, 0, -days).UnixMilli()
	_, err := model.DeleteOldLog(ctx, target, 500)
	if err != nil {
		common.SysLog(fmt.Sprintf("auto log cleanup failed: %v", err))
	}
}

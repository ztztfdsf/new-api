package controller

import (
	"net/http"
	"strconv"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/i18n"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

// CreateInvitationCode handles admin creating invitation codes.
func CreateInvitationCode(c *gin.Context) {
	var req struct {
		ExpiresAt int64  `json:"expires_at"` // unix, 0 = no expiry
		Note      string `json:"note"`
		Count     int    `json:"count"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorI18n(c, i18n.MsgInvalidParams)
		return
	}
	if req.Count <= 0 || req.Count > 100 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": i18n.T(c, i18n.MsgInvitationInvalidCount),
		})
		return
	}
	adminId := c.GetInt("id")
	if adminId == 0 {
		common.ApiErrorI18n(c, i18n.MsgAuthNotLoggedIn)
		return
	}
	var expiresAt int64
	if req.ExpiresAt > 0 {
		expiresAt = req.ExpiresAt
	}
	if req.Note == "" {
		req.Note = ""
	}
	codes, err := model.CreateInvitationCodesBatch(adminId, expiresAt, req.Note, req.Count)
	if err != nil {
		common.SysLog("create invitation codes failed: " + err.Error())
		common.ApiErrorI18n(c, i18n.MsgDatabaseError)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": i18n.T(c, i18n.MsgInvitationCreatedSuccess),
		"data":    codes,
	})
}

// ListInvitationCodes returns paginated list of all invitation codes.
func ListInvitationCodes(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	codes, total, err := model.ListInvitationCodes(page, pageSize)
	if err != nil {
		common.SysLog("list invitation codes failed: " + err.Error())
		common.ApiErrorI18n(c, i18n.MsgDatabaseError)
		return
	}
	now := time.Now().Unix()
	for i := range codes {
		codes[i].Note = maskCode(codes[i].Code, codes[i].Note)
		codes[i].Code = maskCode(codes[i].Code, "")
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"items":  codes,
			"total":  total,
			"page":   page,
			"limit":  pageSize,
		},
	})
}

// DeleteInvitationCode handles deleting a single invitation code by id.
func DeleteInvitationCode(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": i18n.T(c, i18n.MsgInvitationIdRequired),
		})
		return
	}
	if err := model.DeleteInvitationCode(id); err != nil {
		common.SysLog("delete invitation code failed: " + err.Error())
		common.ApiErrorI18n(c, i18n.MsgDatabaseError)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": i18n.T(c, i18n.MsgInvitationDeletedSuccess),
	})
}

func maskCode(code, note string) string {
	if code == "" {
		return code
	}
	if len(code) <= 4 {
		return code[:1] + "****"
	}
	return code[:2] + "****" + code[len(code)-2:]
}

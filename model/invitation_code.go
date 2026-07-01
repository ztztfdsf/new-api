package model

import (
	"fmt"
	"math/rand"
	"time"
)

const invitationCodeLength = 10

type InvitationCode struct {
	Id        int    `gorm:"primaryKey" json:"id"`
	Code      string `gorm:"uniqueIndex;size:32;not null" json:"code"`
	CreatedBy int    `gorm:"column:created_by;index" json:"created_by"`
	InviteeId int    `gorm:"column:invitee_id;index;default:0" json:"invitee_id"`
	ExpiresAt int64  `gorm:"column:expires_at;index;default:0" json:"expires_at"`
	UsedAt    int64  `gorm:"column:used_at;default:0" json:"used_at"`
	Note      string `gorm:"size:255;default:''" json:"note"`
	CreatedAt int64  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
}

func (InvitationCode) TableName() string {
	return "invitation_codes"
}

var reservedCodes = map[string]bool{
	"random": true, "generate": true, "new": true, "admin": true, "test": true,
}

func generateUniqueCode() string {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	chars := "abcdefghjkmnpqrstuvwxyz23456789"
	for {
		code := make([]byte, invitationCodeLength)
		for i := range code {
			code[i] = chars[r.Intn(len(chars))]
		}
		s := string(code)
		if reservedCodes[s] {
			continue
		}
		var existing InvitationCode
		if DB.Where("code = ?", s).First(&existing).Error == nil {
			continue
		}
		return s
	}
}

func CreateInvitationCode(creatorId int, expiresAt int64, note string) (*InvitationCode, error) {
	code := generateUniqueCode()
	now := time.Now().Unix()
	inv := InvitationCode{
		Code:      code,
		CreatedBy: creatorId,
		ExpiresAt: expiresAt,
		Note:      note,
		CreatedAt: now,
	}
	if err := DB.Create(&inv).Error; err != nil {
		return nil, fmt.Errorf("failed to create invitation code: %w", err)
	}
	return &inv, nil
}

func CreateInvitationCodesBatch(creatorId int, expiresAt int64, note string, count int) ([]InvitationCode, error) {
	if count <= 0 || count > 100 {
		return nil, fmt.Errorf("batch count must be between 1 and 100")
	}
	codes := make([]InvitationCode, 0, count)
	for i := 0; i < count; i++ {
		code := generateUniqueCode()
		codes = append(codes, InvitationCode{
			Code:      code,
			CreatedBy: creatorId,
			ExpiresAt: expiresAt,
			Note:      note,
			CreatedAt: time.Now().Unix(),
		})
	}
	if err := DB.CreateInBatches(&codes, 50).Error; err != nil {
		return nil, fmt.Errorf("failed to batch create invitation codes: %w", err)
	}
	return codes, nil
}

func GetInvitationByCode(code string) (*InvitationCode, error) {
	var inv InvitationCode
	if err := DB.Where("code = ?", code).First(&inv).Error; err != nil {
		return nil, err
	}
	return &inv, nil
}

func MarkInvitationUsed(code string, userId int) error {
	now := time.Now().Unix()
	return DB.Model(&InvitationCode{}).Where("code = ?", code).Updates(map[string]any{
		"invitee_id": userId,
		"used_at":    now,
	}).Error
}

func ListInvitationCodes(page, pageSize int) ([]InvitationCode, int64, error) {
	var codes []InvitationCode
	var total int64
	if err := DB.Model(&InvitationCode{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * pageSize
	if err := DB.Order("created_at DESC").Limit(pageSize).Offset(offset).Find(&codes).Error; err != nil {
		return nil, 0, err
	}
	return codes, total, nil
}

func DeleteInvitationCode(id int) error {
	return DB.Delete(&InvitationCode{}, id).Error
}

func ValidateInvitationCode(code string) (bool, string) {
	if code == "" {
		return false, "invitation.code_required"
	}
	inv, err := GetInvitationByCode(code)
	if err != nil {
		return false, "invitation.code_invalid"
	}
	if inv.InviteeId != 0 || inv.UsedAt != 0 {
		return false, "invitation.code_used"
	}
	if inv.ExpiresAt > 0 && time.Now().Unix() > inv.ExpiresAt {
		return false, "invitation.code_expired"
	}
	return true, ""
}

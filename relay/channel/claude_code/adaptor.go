package claude_code

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"runtime"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/relay/channel"
	"github.com/QuantumNous/new-api/relay/channel/claude"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/QuantumNous/new-api/types"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Adaptor struct {
}

const (
	claudeCodeVersion      = "2.1.146"
	stainlessPkgVersion   = "0.94.0"
	deviceID              = "0907c69b1b9ca6a3c23e23622bab14c8d51b149385afc309bb6dc8bfabc00e23"
	upstreamMaxTokens     = 32000
)

func (a *Adaptor) Init(info *relaycommon.RelayInfo) {
}

func (a *Adaptor) GetRequestURL(info *relaycommon.RelayInfo) (string, error) {
	return fmt.Sprintf("%s/v1/messages?beta=true", info.ChannelBaseUrl), nil
}

func (a *Adaptor) SetupRequestHeader(c *gin.Context, req *http.Header, info *relaycommon.RelayInfo) error {
	channel.SetupApiRequestHeader(info, c, req)

	// Claude Code specific headers
	sessionID := uuid.New().String()

	req.Set("Accept", "application/json")
	req.Set("Content-Type", "application/json")
	req.Set("User-Agent", fmt.Sprintf("claude-cli/%s (external, sdk-cli)", claudeCodeVersion))
	req.Set("X-Claude-Code-Session-Id", sessionID)
	req.Set("X-Stainless-Arch", runtime.GOARCH)
	req.Set("X-Stainless-Lang", "js")
	req.Set("X-Stainless-OS", runtime.GOOS)
	req.Set("X-Stainless-Package-Version", stainlessPkgVersion)
	req.Set("X-Stainless-Retry-Count", "0")
	req.Set("X-Stainless-Runtime", "node")
	req.Set("X-Stainless-Timeout", "600")
	req.Set("anthropic-beta", "interleaved-thinking-2025-05-14,context-management-2025-06-27,prompt-caching-scope-2026-01-05,claude-code-20250219")
	req.Set("anthropic-dangerous-direct-browser-access", "true")
	req.Set("anthropic-version", "2023-06-01")
	req.Set("x-api-key", info.ApiKey)
	req.Set("x-app", "cli")

	// Store session ID in context for later use
	c.Set("cc_session_id", sessionID)

	return nil
}

func (a *Adaptor) ConvertOpenAIRequest(c *gin.Context, info *relaycommon.RelayInfo, request *dto.GeneralOpenAIRequest) (any, error) {
	if request == nil {
		return nil, errors.New("request is nil")
	}

	// Convert OpenAI messages to Claude format
	claudeReq, err := claude.RequestOpenAI2ClaudeMessage(c, *request)
	if err != nil {
		return nil, fmt.Errorf("claude code: convert messages failed: %w", err)
	}

	// Build Claude Code specific request
	ccReq := buildClaudeCodeRequest(c, claudeReq, info)
	return ccReq, nil
}

func buildClaudeCodeRequest(c *gin.Context, claudeReq *dto.ClaudeRequest, info *relaycommon.RelayInfo) (*dto.ClaudeRequest, error) {
	sessionID := c.GetString("cc_session_id")
	if sessionID == "" {
		sessionID = uuid.New().String()
	}

	// Build system blocks (Claude Code specific)
	dateStr := time.Now().Format("2006-01-02")
	systemBlocks := []ClaudeSystemBlock{
		{
			Type: "text",
			Text: fmt.Sprintf("x-anthropic-billing-header: cc_version=%s.92a; cc_entrypoint=sdk-cli; cch=f0c9d;", claudeCodeVersion),
		},
		{
			Type:         "text",
			Text:         "You are a Claude agent, built on Anthropic's Claude Agent SDK.",
			CacheControl: &CacheControl{Type: "ephemeral"},
		},
	}

	// Collect system texts
	systemTexts := []string{fmt.Sprintf("CWD: /\nDate: %s", dateStr)}
	if claudeReq.System != nil {
		if sysStr, ok := claudeReq.System.(string); ok && sysStr != "" {
			systemTexts = append(systemTexts, sysStr)
		}
	}

	for _, st := range systemTexts {
		systemBlocks = append(systemBlocks, ClaudeSystemBlock{
			Type:         "text",
			Text:         st,
			CacheControl: &CacheControl{Type: "ephemeral"},
		})
	}

	// Marshal system blocks to JSON
	sysRaw, err := json.Marshal(systemBlocks)
	if err != nil {
		return nil, fmt.Errorf("claude code: marshal system blocks failed: %w", err)
	}

	// Build metadata
	metadata := ClaudeMetadata{
		UserID: fmt.Sprintf(`{"device_id":"%s","account_uuid":"","session_id":"%s"}`, deviceID, sessionID),
	}
	metaRaw, err := json.Marshal(metadata)
	if err != nil {
		return nil, fmt.Errorf("claude code: marshal metadata failed: %w", err)
	}

	// Build context management
	contextMgmt := ClaudeContextManagement{
		Edits: []ClaudeContextEdit{
			{Type: "clear_thinking_20251015", Keep: "all"},
		},
	}
	ctxRaw, err := json.Marshal(contextMgmt)
	if err != nil {
		return nil, fmt.Errorf("claude code: marshal context management failed: %w", err)
	}

	// Create the Claude Code request
	maxTokens := uint(upstreamMaxTokens)
	stream := true

	ccReq := &dto.ClaudeRequest{
		Model:             claudeReq.Model,
		Messages:          claudeReq.Messages,
		MaxTokens:         &maxTokens,
		Stream:            &stream,
		Tools:             claudeReq.Tools,
		ToolChoice:        claudeReq.ToolChoice,
		Thinking:          claudeReq.Thinking,
		Metadata:          metaRaw,
		ContextManagement: ctxRaw,
	}

	// Set system as the custom system blocks JSON array
	ccReq.System = json.RawMessage(sysRaw)

	return ccReq, nil
}

func (a *Adaptor) ConvertRerankRequest(c *gin.Context, relayMode int, request dto.RerankRequest) (any, error) {
	return nil, errors.New("claude code: endpoint not supported")
}

func (a *Adaptor) ConvertEmbeddingRequest(c *gin.Context, info *relaycommon.RelayInfo, request dto.EmbeddingRequest) (any, error) {
	return nil, errors.New("claude code: endpoint not supported")
}

func (a *Adaptor) ConvertAudioRequest(c *gin.Context, info *relaycommon.RelayInfo, request dto.AudioRequest) (io.Reader, error) {
	return nil, errors.New("claude code: endpoint not supported")
}

func (a *Adaptor) ConvertImageRequest(c *gin.Context, info *relaycommon.RelayInfo, request dto.ImageRequest) (any, error) {
	return nil, errors.New("claude code: endpoint not supported")
}

func (a *Adaptor) ConvertOpenAIResponsesRequest(c *gin.Context, info *relaycommon.RelayInfo, request dto.OpenAIResponsesRequest) (any, error) {
	return nil, errors.New("claude code: endpoint not supported")
}

func (a *Adaptor) ConvertClaudeRequest(c *gin.Context, info *relaycommon.RelayInfo, request *dto.ClaudeRequest) (any, error) {
	return nil, errors.New("claude code: /v1/messages endpoint not supported")
}

func (a *Adaptor) ConvertGeminiRequest(c *gin.Context, info *relaycommon.RelayInfo, request *dto.GeminiChatRequest) (any, error) {
	return nil, errors.New("claude code: endpoint not supported")
}

func (a *Adaptor) DoRequest(c *gin.Context, info *relaycommon.RelayInfo, requestBody io.Reader) (any, error) {
	if info.RelayMode != relayconstant.RelayModeChatCompletions {
		return nil, errors.New("claude code: only /v1/chat/completions is supported")
	}
	return channel.DoApiRequest(a, c, info, requestBody)
}

func (a *Adaptor) DoResponse(c *gin.Context, resp *http.Response, info *relaycommon.RelayInfo) (usage any, err *types.NewAPIError) {
	info.FinalRequestRelayFormat = types.RelayFormatClaude
	if info.IsStream {
		return claude.ClaudeStreamHandler(c, resp, info)
	}
	return claude.ClaudeHandler(c, resp, info)
}

func (a *Adaptor) GetModelList() []string {
	return ModelList
}

func (a *Adaptor) GetChannelName() string {
	return ChannelName
}
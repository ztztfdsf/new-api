package claude_code

// ClaudeCode system block (array format)
type ClaudeSystemBlock struct {
	Type         string       `json:"type"`
	Text         string       `json:"text"`
	CacheControl *CacheControl `json:"cache_control,omitempty"`
}

type CacheControl struct {
	Type string `json:"type"`
}

// ClaudeCode metadata
type ClaudeMetadata struct {
	UserID string `json:"user_id"`
}

// ClaudeCode context management
type ClaudeContextManagement struct {
	Edits []ClaudeContextEdit `json:"edits"`
}

type ClaudeContextEdit struct {
	Type string `json:"type"`
	Keep string `json:"keep"`
}
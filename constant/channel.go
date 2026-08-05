package constant

const (
	ChannelTypeUnknown    = 0
	ChannelTypeOpenAI     = 1
	ChannelTypeClaudeCode = 2
	ChannelTypeDummy      // this one is only for count, do not add any channel after this
)

var ChannelBaseURLs = []string{
	"",                       // 0
	"https://api.openai.com", // 1
	"",                       // 2
}

var ChannelTypeNames = map[int]string{
	ChannelTypeUnknown:    "Unknown",
	ChannelTypeOpenAI:     "OpenAI",
	ChannelTypeClaudeCode: "Claude Code",
}

func GetChannelTypeName(channelType int) string {
	if name, ok := ChannelTypeNames[channelType]; ok {
		return name
	}
	return "Unknown"
}
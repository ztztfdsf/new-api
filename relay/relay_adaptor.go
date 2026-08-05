package relay

import (
	"strconv"

	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/relay/channel"
	"github.com/QuantumNous/new-api/relay/channel/claude"
	"github.com/QuantumNous/new-api/relay/channel/claude_code"
	"github.com/QuantumNous/new-api/relay/channel/openai"
	"github.com/QuantumNous/new-api/relay/channel/task/suno"
	"github.com/gin-gonic/gin"
)

func GetAdaptor(apiType int) channel.Adaptor {
	switch apiType {
	case constant.APITypeOpenAI:
		return &openai.Adaptor{}
	case constant.APITypeAnthropic:
		return &claude.Adaptor{}
	case constant.APITypeClaudeCode:
		return &claude_code.Adaptor{}
	}
	return nil
}

func GetTaskPlatform(c *gin.Context) constant.TaskPlatform {
	channelType := c.GetInt("channel_type")
	if channelType > 0 {
		return constant.TaskPlatform(strconv.Itoa(channelType))
	}
	return constant.TaskPlatform(c.GetString("platform"))
}

func GetTaskAdaptor(platform constant.TaskPlatform) channel.TaskAdaptor {
	switch platform {
	case constant.TaskPlatformSuno:
		return &suno.TaskAdaptor{}
	}
	return nil
}
package common

import "github.com/QuantumNous/new-api/constant"

func ChannelType2APIType(channelType int) (int, bool) {
	apiType := -1
	switch channelType {
	case constant.ChannelTypeOpenAI:
		apiType = constant.APITypeOpenAI
	case constant.ChannelTypeClaudeCode:
		apiType = constant.APITypeClaudeCode
	}
	if apiType == -1 {
		return constant.APITypeOpenAI, false
	}
	return apiType, true
}

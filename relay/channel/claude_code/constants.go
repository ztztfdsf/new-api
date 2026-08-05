package claude_code

import "github.com/QuantumNous/new-api/setting/ratio_setting"

var baseModelList = []string{
	"claude-sonnet-4-20250514",
	"claude-sonnet-4-20250515",
	"claude-4-5-sonnet-20251022",
	"claude-haiku-4-5-20251001",
}

var ModelList = withCompactModelSuffix(baseModelList)

const ChannelName = "claude-code"

func withCompactModelSuffix(models []string) []string {
	out := make([]string, len(models)*2)
	for i, m := range models {
		out[i*2] = m
		out[i*2+1] = ratio_setting.WithCompactModelSuffix(m)
	}
	return out
}
package constant

type MultiKeyMode string

const (
	MultiKeyModeRandom   MultiKeyMode = "random"   // 随机
	MultiKeyModePolling  MultiKeyMode = "polling"  // 轮询
	MultiKeyModeFailover MultiKeyMode = "failover" // 故障转移
)

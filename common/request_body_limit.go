package common

import "github.com/QuantumNous/new-api/constant"

const defaultAnonymousRequestBodyLimitKB = 8192

func GetAnonymousRequestBodyLimitBytes() int64 {
	limitKB := constant.AnonymousRequestBodyLimitKB
	if limitKB < 0 {
		limitKB = defaultAnonymousRequestBodyLimitKB
	}
	return int64(limitKB) << 10
}

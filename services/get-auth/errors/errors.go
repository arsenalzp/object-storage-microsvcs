package errors

import (
	"fmt"

	"github.com/pkg/errors"
)

const (
	DbClntInitErr = "EDBCLNT-0001"
	DbClntErr     = "EDBCLNT-0002"
	DbConnErr     = "EDBCLNT-0003"

	UtilAuthChckErr = "EUTIL-0104"
	UtilAuthDecErr  = "EUTIL-0205"

	HndlrAuthErr = "EHNDLR-0106"

	AdaptDocNotFound = "WADAPT-0107"
	AdaptDecodeErr   = "EADAPT-0208"
	LsnrErr          = "ESRV-9999"
)

type ErrNoDocuments struct {
	Msg string
	Err error
}

type ErrCommon struct {
	Msg  string
	Code string
	Err  error
}

func (e ErrCommon) Error() string {
	return fmt.Sprintf(
		"%s, code: %s, %s",
		e.Msg, e.Code, e.Err,
	)
}

func (enf ErrNoDocuments) Error() string {
	return fmt.Sprintf(
		"%s: %s",
		enf.Msg, enf.Err,
	)
}

func New(msg string, code string, err error) error {
	return errors.WithStack(&ErrCommon{
		Msg: msg, Code: code, Err: err,
	})
}

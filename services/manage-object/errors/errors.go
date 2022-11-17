package errors

import (
	"fmt"

	"github.com/pkg/errors"
)

const (
	DbClntInitErr = "EDBCLNT-0001"
	DbClntErr     = "EDBCLNT-0002"
	DbConnErr     = "EDBCLNT-0003"

	SvcCtxErr      = "ESVCCLNT-0004"
	SvcHttpClntErr = "ESVCCLNT-0005"
	SvcClntInitErr = "ESVCCLNT-0006"

	HndlrDelBAuthErr  = "EHNDLR-1001"
	HndlrDelObAuthErr = "EHNDLR-1002"
	HndlrDelDbErr     = "EHNDLR-0003"
	HndlrDelFsErr     = "EHNDLR-0004"

	HndlrGetBAuthErr  = "EHNDLR-1005"
	HndlrGetObAuthErr = "EHNDLR-1006"
	HndlrGetDbErr     = "EHNDLR-0107"
	HndlrGetFsErr     = "EHNDLR-0108"
	HndlrGetWrtErr    = "EHNDLR-0109"

	HndlrPutBAuthErr       = "EHNDLR-1010"
	HndlrPutObAuthErr      = "EHNDLR-1011"
	HndlrPutDbCretErr      = "EHNDLR-0112"
	HndlrPutDbUpdErr       = "EHNDLR-0213"
	HndlrPutFsCretErr      = "EHNDLR-0114"
	HndlrPutFsUpdErr       = "EHNDLR-0215"
	HndlrPutDbGetIdErr     = "EHNDLR-0116"
	HndlrPutDbGetVersIdErr = "EHNDLR-0217"
	HndlrPutDbCrtVersIdErr = "EHNDLR-0318"

	StgDbGetObjIdErr       = "ESTG-0101"
	StgDbGetBcktIdErr      = "ESTG-0103"
	StgDbUpdObjErr         = "ESTG-0105"
	StgDbUpdObjNotFoundErr = "ESTG-0206"
	StgDbCrtObjErr         = "ESTG-0107"
	StgDbDelObjErr         = "ESTG-0108"
	StgFsGetObjErr         = "ESTG-0110"
	StgFsCrtObjErr         = "ESTG-0111"
	StgFsCrtObjTruncErr    = "ESTG-0212"
	StgFsCrtObjWrtErr      = "ESTG-0313"
	StgFsCrtObjChgTimeErr  = "ESTG-0414"
	StgFsDelObjErr         = "ESTG-0115"
	StgFsDelObjDelFileErr  = "ESTG-0216"
	StgFsLckErr            = "ESTG-0117"
	StgDbDelObjUndoErr     = "ESTG-0318"
	StgDbCrtObjUndoErr     = "ESTG-0219"
	StgDbUpdObjUndoErr     = "ESTG-0420"
	LsnrErr                = "ESRV-9999"
)

type Error struct {
	Msg  string
	Err  error
	Code string
}

func (eh Error) Error() string {
	return fmt.Sprintf(
		"%s: %s, code: %s",
		eh.Msg, eh.Code, eh.Err,
	)
}

func New(msg string, code string, err error) error {
	return errors.WithStack(&Error{
		Msg: msg, Code: code, Err: err,
	})
}

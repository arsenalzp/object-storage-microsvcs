package fs

import (
	"bufio"
	"io"
	ent "manage-object/entities"
	"manage-object/errors"
	"os"
	"path/filepath"
	"time"

	"golang.org/x/sys/unix"
)

var OBJSTORE_PATH = filepath.Join("/", "opt", "objstore")

func GetObject(objId ent.ObjectId) (*bufio.Reader, *os.File, error) {

	objPath := filepath.Join(OBJSTORE_PATH, objId.IdToStr())
	file, err := os.OpenFile(objPath, os.O_RDONLY, 0600)
	if err != nil {
		err = errors.New("storage error:", errors.StgFsGetObjErr, err)
		return nil, nil, err
	}

	err = lock(file, unix.F_RDLCK)
	if err != nil {
		return nil, nil, err
	}

	reader := bufio.NewReader(file)

	return reader, file, nil
}

func CreateUpdateObject(objId ent.ObjectId, body *io.ReadCloser, curTime time.Time) error {
	objPath := filepath.Join(OBJSTORE_PATH, objId.IdToStr())
	file, err := os.OpenFile(objPath, os.O_CREATE|os.O_WRONLY, 0600)
	if err != nil {
		err = errors.New("storage error:", errors.StgFsCrtObjErr, err)
		return err
	}

	defer file.Close()

	err = lock(file, unix.F_WRLCK)
	if err != nil {
		return err
	}

	err = unix.Ftruncate(int(file.Fd()), 0)
	if err != nil {
		err = errors.New("storage error:", errors.StgFsCrtObjTruncErr, err)
		return err
	}

	reader := bufio.NewReader(*body)
	writer := bufio.NewWriter(file)
	_, err = reader.WriteTo(writer)
	if err != nil {
		err = errors.New("storage error:", errors.StgFsCrtObjWrtErr, err)
		return err
	}

	err = os.Chtimes(objPath, curTime, curTime)
	if err != nil {
		err = errors.New("storage error:", errors.StgFsCrtObjChgTimeErr, err)
		return err
	}

	return nil
}

func DelObject(objId *ent.ObjectId) error {
	objPath := filepath.Join(OBJSTORE_PATH, objId.IdToStr())
	file, err := os.OpenFile(objPath, os.O_TRUNC|os.O_WRONLY, 0600)
	if err != nil {
		err = errors.New("storage error:", errors.StgFsDelObjErr, err)
		return err
	}

	defer file.Close()

	err = lock(file, unix.F_WRLCK)
	if err != nil {
		return err
	}

	err = os.Remove(objPath)
	if err != nil {
		err = errors.New("storage error:", errors.StgFsDelObjDelFileErr, err)

		return err
	}

	return nil
}

package fs

import (
	"manage-object/errors"
	"os"

	"golang.org/x/sys/unix"
)

func lock(file *os.File, l_type int16) error {
	var flock unix.Flock_t

	fd := file.Fd() // get file descriptor from the given file

	// create the lock
	flock = unix.Flock_t{
		Type:   l_type,
		Whence: unix.SEEK_SET,
		Start:  0,
		Len:    0, // lock entire file
	}
	err := unix.FcntlFlock(fd, unix.F_OFD_SETLKW, &flock) // put the lock on the file descriptor
	if err != nil {
		err = errors.New("storage error:", errors.StgFsLckErr, err)
		return err
	}

	return nil
}

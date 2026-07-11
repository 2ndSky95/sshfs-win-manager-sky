import { execFile } from 'child_process'

import ProcessHandlerLinux from './ProcessHandlerLinux.js'
import { currentPlatform, getConnectionMountPoint } from '@/platform/index.js'

class ProcessHandlerMac extends ProcessHandlerLinux {
  // FUSE-T's go-nfsv4 force-unmounts on its own as soon as sshfs dies, so
  // terminating first is much faster than waiting for diskutil on a busy
  // volume. The unmount pass afterwards only cleans up leftovers.
  terminate (pid, conn = null) {
    return new Promise(resolve => {
      execFile('kill', ['-TERM', String(pid)], () => {
        const mountPoint = conn ? getConnectionMountPoint(conn) : null

        if (!mountPoint || mountPoint === 'auto') {
          resolve()
          return
        }

        setTimeout(() => {
          this.unmount(mountPoint)
            .catch(() => {})
            .then(() => resolve())
        }, 500)
      })
    })
  }

  getSshfsBinaryCandidates () {
    return [
      this.settings.sshfsBinary,
      currentPlatform.sshfsBinary,
      ...(currentPlatform.sshfsBinaryAlternatives || []),
      '/usr/bin/sshfs'
    ].filter((candidate, index, candidates) => candidate && candidates.indexOf(candidate) === index)
  }

  getMissingBinaryError (sshfsBinary) {
    return `SSHFS binary not found at "${sshfsBinary}". Install macFUSE and SSHFS, or update your SSHFS binary setting.`
  }

  getDefaultMountOptions (conn) {
    return [
      ...super.getDefaultMountOptions(conn),
      `-ovolname=${String(conn.name || 'SSHFS').substr(0, 32)}`
    ]
  }

  getUnmountCommands (mountPoint) {
    // Finder often holds the volume busy (.DS_Store); escalate to force
    // instead of timing out and hard-killing sshfs.
    return [
      { file: 'umount', args: [mountPoint] },
      { file: 'diskutil', args: ['unmount', mountPoint] },
      { file: 'diskutil', args: ['unmount', 'force', mountPoint] }
    ]
  }
}

export default ProcessHandlerMac

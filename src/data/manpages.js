export const MAN_PAGES = {
  echo: `ECHO(1)

NAME
       echo - display a line of text

SYNOPSIS
       echo [SHORT-OPTION]... [STRING]...

DESCRIPTION
       Echo the STRING(s) to standard output.

       -n    do not output the trailing newline
       -e    enable interpretation of backslash escapes

  / to search · q to quit`,

  cat: `CAT(1)

NAME
       cat - concatenate files and print on the standard output

SYNOPSIS
       cat [OPTION]... [FILE]...

DESCRIPTION
       Concatenate FILE(s) to standard output.

       -n    number all output lines
       -b    number nonempty output lines
       -s    suppress repeated empty output lines

  / to search · q to quit`,

  ls: `LS(1)

NAME
       ls - list directory contents

SYNOPSIS
       ls [OPTION]... [FILE]...

DESCRIPTION
       -a    do not ignore entries starting with .
       -l    use a long listing format
       -h    human-readable sizes
       -R    list subdirectories recursively
       -S    sort by file size
       -t    sort by modification time

  / to search · q to quit`,

  cd: `CD(1)

NAME
       cd - change the working directory

SYNOPSIS
       cd [dir]

DESCRIPTION
       Change the current directory to dir. The default dir is
       the value of the HOME shell variable.

       cd -       go to previous directory
       cd ..      go up one level
       cd ~       go to home directory

  / to search · q to quit`,

  mkdir: `MKDIR(1)

NAME
       mkdir - make directories

SYNOPSIS
       mkdir [OPTION]... DIRECTORY...

DESCRIPTION
       Create the DIRECTORY(ies), if they do not already exist.

       -p    make parent directories as needed
       -v    print a message for each created directory
       -m    set file mode (permissions)

  / to search · q to quit`,

  rm: `RM(1)

NAME
       rm - remove files or directories

SYNOPSIS
       rm [OPTION]... [FILE]...

DESCRIPTION
       Remove (unlink) the FILE(s).

       -f    ignore nonexistent files, never prompt
       -i    prompt before every removal
       -r    remove directories and their contents recursively

       WARNING: rm deletes permanently. There is no trash can.

  / to search · q to quit`,

  cp: `CP(1)

NAME
       cp - copy files and directories

SYNOPSIS
       cp [OPTION]... SOURCE DEST

DESCRIPTION
       Copy SOURCE to DEST, or multiple SOURCE(s) to DIRECTORY.

       -r    copy directories recursively
       -i    prompt before overwrite
       -v    explain what is being done
       -p    preserve mode, ownership, timestamps

  / to search · q to quit`,

  mv: `MV(1)

NAME
       mv - move (rename) files

SYNOPSIS
       mv [OPTION]... SOURCE DEST

DESCRIPTION
       Rename SOURCE to DEST, or move SOURCE(s) to DIRECTORY.

       -i    prompt before overwrite
       -f    do not prompt before overwriting
       -v    explain what is being done

  / to search · q to quit`,

  chmod: `CHMOD(1)

NAME
       chmod - change file mode bits

SYNOPSIS
       chmod [OPTION]... MODE[,MODE]... FILE...

DESCRIPTION
       Change the mode (permissions) of each FILE.

       Numeric modes: 3-4 octal digits (e.g. 755, 644, 600)
         7=rwx  6=rw-  5=r-x  4=r--  0=---

       Symbolic modes:
         chmod +x file     add execute permission
         chmod u+w file    add write for owner
         chmod go-r file   remove read for group/others

  / to search · q to quit`,

  chown: `CHOWN(1)

NAME
       chown - change file owner and group

SYNOPSIS
       chown [OPTION]... [OWNER][:[GROUP]] FILE...

DESCRIPTION
       Change the user and/or group ownership of each FILE.

       -R    operate on files and directories recursively
       -v    output a diagnostic for every file processed

  / to search · q to quit`,

  grep: `GREP(1)

NAME
       grep - print lines that match patterns

SYNOPSIS
       grep [OPTION]... PATTERNS [FILE]...

DESCRIPTION
       Search for PATTERNS in each FILE.

       -i    ignore case distinctions
       -r    read all files under each directory recursively
       -n    prefix each line with its line number
       -c    count matching lines
       -v    invert match (show non-matching lines)
       -l    list files with matches
       -w    match whole words only

  / to search · q to quit`,

  find: `FIND(1)

NAME
       find - search for files in a directory hierarchy

SYNOPSIS
       find [path...] [expression]

DESCRIPTION
       Search for files matching criteria below path.

       -name pattern    match filename (supports wildcards)
       -type f          regular files only
       -type d          directories only
       -size +10M       larger than 10 megabytes
       -mtime -7        modified in last 7 days
       -exec cmd {} \\;  run cmd on each result

  / to search · q to quit`,

  head: `HEAD(1)

NAME
       head - output the first part of files

SYNOPSIS
       head [OPTION]... [FILE]...

DESCRIPTION
       Print the first 10 lines of each FILE to standard output.

       -n NUM    print the first NUM lines
       -c NUM    print the first NUM bytes

  / to search · q to quit`,

  tail: `TAIL(1)

NAME
       tail - output the last part of files

SYNOPSIS
       tail [OPTION]... [FILE]...

DESCRIPTION
       Print the last 10 lines of each FILE to standard output.

       -n NUM    output the last NUM lines
       -f        follow — output appended data as file grows
       -c NUM    output the last NUM bytes

  / to search · q to quit`,

  less: `LESS(1)

NAME
       less - opposite of more — scroll through file

SYNOPSIS
       less [FILE]...

DESCRIPTION
       View file contents one screen at a time.

       SPACE     next page
       b         previous page
       /pattern  search forward
       n         next search result
       g         go to start
       G         go to end
       q         quit

  / to search · q to quit`,

  wc: `WC(1)

NAME
       wc - print newline, word, and byte counts

SYNOPSIS
       wc [OPTION]... [FILE]...

DESCRIPTION
       Print line, word, and byte counts for each FILE.

       -l    print the newline count (lines)
       -w    print the word count
       -c    print the byte count
       -m    print the character count

  / to search · q to quit`,

  sort: `SORT(1)

NAME
       sort - sort lines of text files

SYNOPSIS
       sort [OPTION]... [FILE]...

DESCRIPTION
       Write sorted concatenation of all FILE(s) to stdout.

       -r    reverse the result of comparisons
       -n    compare according to string numerical value
       -k N  sort by column N
       -u    output only unique lines
       -h    compare human readable numbers (2K, 1G)

  / to search · q to quit`,

  ps: `PS(1)

NAME
       ps - report a snapshot of current processes

SYNOPSIS
       ps [options]

DESCRIPTION
       Display information about active processes.

       aux       show all processes for all users
       -e        select all processes
       -f        full format listing
       -p PID    select by process ID

  / to search · q to quit`,

  kill: `KILL(1)

NAME
       kill - send a signal to a process

SYNOPSIS
       kill [-signal] PID...

DESCRIPTION
       Send a signal to each PID. Default signal is TERM (15).

       -9     SIGKILL — force kill (cannot be caught)
       -15    SIGTERM — graceful termination (default)
       -HUP   SIGHUP — reload configuration

  / to search · q to quit`,

  docker: `DOCKER(1)

NAME
       docker - container runtime

SYNOPSIS
       docker [command] [options]

DESCRIPTION
       Build, run, and manage containers.

       build     Build an image from a Dockerfile
       run       Create and start a container
       ps        List running containers
       stop      Stop a running container
       logs      Fetch the logs of a container
       exec      Run a command in a running container
       images    List images
       compose   Manage multi-container apps

  / to search · q to quit`,

  git: `GIT(1)

NAME
       git - the stupid content tracker

SYNOPSIS
       git [command] [options]

DESCRIPTION
       Distributed version control system.

       init      Create a new repository
       clone     Clone a repository
       add       Stage changes
       commit    Record changes
       push      Upload to remote
       pull      Download and merge
       status    Show working tree status
       log       Show commit history
       branch    List, create, or delete branches
       diff      Show changes between commits

  / to search · q to quit`,

  ssh: `SSH(1)

NAME
       ssh - OpenSSH remote login client

SYNOPSIS
       ssh [options] [user@]hostname [command]

DESCRIPTION
       Log into a remote machine and execute commands.

       -p PORT   connect to this port
       -i FILE   identity file (private key)
       -L        local port forwarding
       -v        verbose mode (debugging)

       Config file: ~/.ssh/config

  / to search · q to quit`,

  curl: `CURL(1)

NAME
       curl - transfer a URL

SYNOPSIS
       curl [options] [URL]

DESCRIPTION
       Transfer data from or to a server.

       -I        fetch headers only
       -X METHOD set request method (GET, POST, etc.)
       -H        add header
       -d        send data in POST request
       -o FILE   write output to file
       -s        silent mode
       -L        follow redirects

  / to search · q to quit`,

  tar: `TAR(1)

NAME
       tar - archive utility

SYNOPSIS
       tar [options] [archive] [files]

DESCRIPTION
       Create, extract, or list archive files.

       -c    create a new archive
       -x    extract files from archive
       -z    filter through gzip
       -v    verbose (list files processed)
       -f    use archive file (must be last flag)
       -t    list contents of archive

       Create:  tar -czf archive.tar.gz dir/
       Extract: tar -xzf archive.tar.gz

  / to search · q to quit`,

  alias: `ALIAS(1)

NAME
       alias - define or display aliases

SYNOPSIS
       alias [name[=value] ...]

DESCRIPTION
       Define shortcuts for commands. Without arguments,
       prints all current aliases.

       alias ll="ls -la"    create alias
       alias                 list all aliases
       unalias ll            remove alias

       Aliases are lost when the shell exits.
       Add to ~/.bashrc to make permanent.

  / to search · q to quit`,

  pwd: `PWD(1)

NAME
       pwd - print name of current/working directory

SYNOPSIS
       pwd [OPTION]...

DESCRIPTION
       Print the full filename of the current working directory.

       -L    print the value of $PWD (logical path)
       -P    print the physical directory, without symlinks

  / to search · q to quit`,

  whoami: `WHOAMI(1)

NAME
       whoami - print effective userid

SYNOPSIS
       whoami

DESCRIPTION
       Print the user name associated with the current effective
       user ID. Same as id -un.

  / to search · q to quit`,

  hostname: `HOSTNAME(1)

NAME
       hostname - show or set the system's host name

SYNOPSIS
       hostname [name]

DESCRIPTION
       Display the system's DNS hostname. When called without
       arguments, displays the current hostname.

       -f    display the FQDN (Fully Qualified Domain Name)
       -I    display all network addresses of the host
       -s    display the short host name

  / to search · q to quit`,

  uname: `UNAME(1)

NAME
       uname - print system information

SYNOPSIS
       uname [OPTION]...

DESCRIPTION
       Print certain system information. With no OPTION, same as -s.

       -a    print all information
       -s    print the kernel name
       -r    print the kernel release
       -m    print the machine hardware name
       -n    print the network node hostname

  / to search · q to quit`,

  touch: `TOUCH(1)

NAME
       touch - change file timestamps

SYNOPSIS
       touch [OPTION]... FILE...

DESCRIPTION
       Update the access and modification times of each FILE to
       the current time. A FILE that does not exist is created empty.

       -a    change only the access time
       -m    change only the modification time
       -c    do not create any files

  / to search · q to quit`,

  du: `DU(1)

NAME
       du - estimate file space usage

SYNOPSIS
       du [OPTION]... [FILE]...

DESCRIPTION
       Summarize disk usage of the set of FILEs, recursively for
       directories.

       -h    print sizes in human readable format (1K, 234M, 2G)
       -s    display only a total for each argument
       -a    show counts for all files, not just directories
       --max-depth=N   print total for directory N levels deep

  / to search · q to quit`,

  ln: `LN(1)

NAME
       ln - make links between files

SYNOPSIS
       ln [OPTION]... TARGET LINK_NAME

DESCRIPTION
       Create a link to TARGET with the name LINK_NAME.

       -s    make symbolic (soft) links instead of hard links
       -f    remove existing destination files
       -v    print name of each linked file

       Hard link: same inode, same filesystem only
       Symlink: pointer to a path, works across filesystems

  / to search · q to quit`,

  zip: `ZIP(1)

NAME
       zip - package and compress files

SYNOPSIS
       zip [options] archive.zip file...

DESCRIPTION
       Add files to a zip archive, compressing them.

       -r    recurse into directories
       -e    encrypt the archive
       -x    exclude files matching pattern
       -9    maximum compression

  / to search · q to quit`,

  unzip: `UNZIP(1)

NAME
       unzip - extract files from a ZIP archive

SYNOPSIS
       unzip [options] archive.zip

DESCRIPTION
       Extract files from a ZIP archive.

       -l    list archive contents without extracting
       -d    extract to a specific directory
       -o    overwrite files without prompting
       -q    quiet mode

  / to search · q to quit`,

  vim: `VIM(1)

NAME
       vim - Vi IMproved, a text editor

SYNOPSIS
       vim [options] [file ...]

DESCRIPTION
       Vim is a highly configurable text editor.

       MODES:
         Normal     navigate and edit (default)
         Insert     type text (press i)
         Visual     select text (press v)
         Command    ex commands (press :)

       ESSENTIAL:
         i          enter insert mode
         Esc        return to normal mode
         :w         save file
         :q         quit
         :wq        save and quit
         :q!        quit without saving
         dd         delete line
         yy         yank (copy) line
         p          paste

  / to search · q to quit`,

  man: `MAN(1)

NAME
       man - an interface to the system reference manuals

SYNOPSIS
       man [section] name...

DESCRIPTION
       Display manual pages for commands and system calls.

       Sections:
         1    User commands
         2    System calls
         3    Library functions
         5    File formats
         8    System administration commands

       Navigation:
         SPACE     next page
         b         previous page
         /pattern  search
         q         quit

  / to search · q to quit`,

  clear: `CLEAR(1)

NAME
       clear - clear the terminal screen

SYNOPSIS
       clear

DESCRIPTION
       Clear the terminal screen. This is equivalent to the
       escape sequence \\033[2J or pressing Ctrl+L in most shells.

  / to search · q to quit`,

  history: `HISTORY(1)

NAME
       history - display command history

SYNOPSIS
       history [n]

DESCRIPTION
       Display the command history list with line numbers.

       history         show all history
       history 10      show last 10 entries
       !!              repeat last command
       !n              repeat command number n
       !string         repeat last command starting with string
       Ctrl+R          reverse search through history

  / to search · q to quit`,

  sudo: `SUDO(8)

NAME
       sudo - execute a command as another user

SYNOPSIS
       sudo [options] command

DESCRIPTION
       Execute a command as the superuser or another user.

       -u user   run as specified user
       -i        simulate initial login
       -s        run a shell
       -l        list allowed commands

       /etc/sudoers controls who may use sudo.
       Use visudo to edit the sudoers file safely.

  / to search · q to quit`,

  diff: `DIFF(1)

NAME
       diff - compare files line by line

SYNOPSIS
       diff [OPTION]... FILE1 FILE2

DESCRIPTION
       Compare files line by line and show differences.

       -u    unified format (most readable)
       -r    recursively compare subdirectories
       -q    report only whether files differ
       -i    ignore case differences
       --color    colorize output

  / to search · q to quit`,

  uniq: `UNIQ(1)

NAME
       uniq - report or omit repeated lines

SYNOPSIS
       uniq [OPTION]... [INPUT [OUTPUT]]

DESCRIPTION
       Filter adjacent matching lines from INPUT. Note: input
       must be sorted first for uniq to detect all duplicates.

       -c    prefix lines by the number of occurrences
       -d    only print duplicate lines
       -u    only print unique lines
       -i    ignore differences in case

  / to search · q to quit`,

  cut: `CUT(1)

NAME
       cut - remove sections from each line of files

SYNOPSIS
       cut OPTION... [FILE]...

DESCRIPTION
       Print selected parts of lines from each FILE.

       -d DELIM   use DELIM instead of TAB as delimiter
       -f LIST    select only these fields (e.g. -f1,3)
       -c LIST    select only these characters
       -b LIST    select only these bytes

       Example: cut -d',' -f1,3 data.csv

  / to search · q to quit`,

  awk: `AWK(1)

NAME
       awk - pattern scanning and text processing

SYNOPSIS
       awk [options] 'program' [file ...]

DESCRIPTION
       Scan each line for patterns and perform actions.

       $0        entire line
       $1..$N    fields (space-delimited by default)
       -F SEP    set field separator
       NR        current line number
       NF        number of fields in current line

       Examples:
         awk '{print $1}' file       first column
         awk -F',' '{print $2}' f    CSV second column
         awk '$3 > 100' file         filter by value

  / to search · q to quit`,

  sed: `SED(1)

NAME
       sed - stream editor for filtering and transforming text

SYNOPSIS
       sed [OPTION]... {script} [file]...

DESCRIPTION
       Perform text transformations on an input stream.

       s/old/new/     substitute first occurrence per line
       s/old/new/g    substitute all occurrences
       -i             edit files in place
       -n             suppress automatic printing
       /pattern/d     delete matching lines
       /pattern/p     print matching lines (with -n)

       Example: sed -i 's/foo/bar/g' file.txt

  / to search · q to quit`,

  tee: `TEE(1)

NAME
       tee - read from stdin and write to stdout and files

SYNOPSIS
       tee [OPTION]... [FILE]...

DESCRIPTION
       Copy standard input to each FILE, and also to stdout.
       Useful for saving intermediate results in a pipeline.

       -a    append to the given FILEs, do not overwrite

       Example: ls | tee filelist.txt | wc -l

  / to search · q to quit`,

  xargs: `XARGS(1)

NAME
       xargs - build and execute command lines from stdin

SYNOPSIS
       xargs [options] [command [initial-arguments]]

DESCRIPTION
       Read items from stdin and execute command with those items
       as arguments.

       -I {}     replace {} with each input item
       -n N      use at most N arguments per command
       -P N      run up to N processes in parallel
       -0        input items are null-terminated

       Example: find . -name "*.log" | xargs rm

  / to search · q to quit`,

  top: `TOP(1)

NAME
       top - display Linux processes

SYNOPSIS
       top [options]

DESCRIPTION
       Dynamic real-time view of running processes.

       Interactive keys:
         q         quit
         k         kill a process
         M         sort by memory usage
         P         sort by CPU usage
         1         toggle per-CPU view
         h         help

  / to search · q to quit`,

  htop: `HTOP(1)

NAME
       htop - interactive process viewer

SYNOPSIS
       htop [options]

DESCRIPTION
       An interactive process viewer for Unix. Enhanced
       alternative to top with color and mouse support.

       F2        setup / config
       F3        search
       F5        tree view
       F6        sort by column
       F9        kill process
       F10/q     quit
       Space     tag process

  / to search · q to quit`,

  bg: `BG(1)

NAME
       bg - resume a suspended job in the background

SYNOPSIS
       bg [job_spec]

DESCRIPTION
       Resume the suspended job in the background, as if it had
       been started with &.

       Ctrl+Z    suspend current foreground job
       bg        resume it in background
       bg %2     resume job number 2

  / to search · q to quit`,

  fg: `FG(1)

NAME
       fg - resume a job in the foreground

SYNOPSIS
       fg [job_spec]

DESCRIPTION
       Move a background or suspended job to the foreground.

       fg        bring most recent job to foreground
       fg %2     bring job number 2 to foreground

  / to search · q to quit`,

  nohup: `NOHUP(1)

NAME
       nohup - run a command immune to hangups

SYNOPSIS
       nohup COMMAND [ARG]...

DESCRIPTION
       Run COMMAND so that it continues running after you log out.
       Output is redirected to nohup.out by default.

       Example: nohup python train.py &

  / to search · q to quit`,

  jobs: `JOBS(1)

NAME
       jobs - display status of jobs in the current session

SYNOPSIS
       jobs [options] [jobspec]

DESCRIPTION
       List the active jobs in the current shell session.

       -l    list process IDs in addition to normal info
       -p    list process IDs only
       -r    list only running jobs
       -s    list only stopped jobs

  / to search · q to quit`,

  lsof: `LSOF(8)

NAME
       lsof - list open files

SYNOPSIS
       lsof [options]

DESCRIPTION
       List information about files opened by processes.

       -i :PORT    list processes using a port
       -u USER     list files opened by user
       -p PID      list files opened by process
       -c NAME     list files opened by command name
       +D DIR      list open files under directory

       Example: lsof -i :8080

  / to search · q to quit`,

  watch: `WATCH(1)

NAME
       watch - execute a program periodically, showing output

SYNOPSIS
       watch [options] command

DESCRIPTION
       Run command repeatedly and display its output.

       -n SEC    update interval in seconds (default 2)
       -d        highlight differences between updates
       -t        turn off the header

       Example: watch -n 1 nvidia-smi

  / to search · q to quit`,

  free: `FREE(1)

NAME
       free - display amount of free and used memory

SYNOPSIS
       free [options]

DESCRIPTION
       Display the total amount of free and used physical and
       swap memory in the system.

       -h    human readable output (GB, MB)
       -m    display in megabytes
       -g    display in gigabytes
       -s N  update every N seconds

  / to search · q to quit`,

  df: `DF(1)

NAME
       df - report file system disk space usage

SYNOPSIS
       df [OPTION]... [FILE]...

DESCRIPTION
       Display information about disk space on mounted filesystems.

       -h    print sizes in human readable format
       -T    print file system type
       -i    list inode information instead of block usage

  / to search · q to quit`,

  uptime: `UPTIME(1)

NAME
       uptime - tell how long the system has been running

SYNOPSIS
       uptime [options]

DESCRIPTION
       Print the current time, how long the system has been running,
       how many users are currently logged on, and the system load
       averages for the past 1, 5, and 15 minutes.

  / to search · q to quit`,

  source: `SOURCE(1)

NAME
       source - execute commands from a file in the current shell

SYNOPSIS
       source filename [arguments]

DESCRIPTION
       Read and execute commands from filename in the current
       shell environment. Unlike running a script, changes to
       variables and functions persist in the current session.

       Equivalent to: . filename

       Common use: source ~/.bashrc

  / to search · q to quit`,

  export: `EXPORT(1)

NAME
       export - set environment variables

SYNOPSIS
       export [name[=value] ...]

DESCRIPTION
       Mark variables to be passed to child processes.

       export VAR=value     set and export
       export VAR           export existing variable
       export -n VAR        unexport variable
       export -p            list all exported variables

       Add to ~/.bashrc to make persistent across sessions.

  / to search · q to quit`,

  which: `WHICH(1)

NAME
       which - locate a command

SYNOPSIS
       which [options] name...

DESCRIPTION
       Show the full path of shell commands. Searches through
       the directories listed in $PATH.

       which python     /usr/bin/python
       which -a node    show all matches in PATH

  / to search · q to quit`,

  "ssh-keygen": `SSH-KEYGEN(1)

NAME
       ssh-keygen - authentication key generation

SYNOPSIS
       ssh-keygen [options]

DESCRIPTION
       Generate, manage, and convert authentication keys for ssh.

       -t TYPE     key type (ed25519, rsa)
       -b BITS     key length (e.g. 4096 for RSA)
       -C comment  add a comment to the key
       -f file     output key file

       Example: ssh-keygen -t ed25519 -C "email@example.com"

  / to search · q to quit`,

  "ssh-copy-id": `SSH-COPY-ID(1)

NAME
       ssh-copy-id - install your public key on a remote machine

SYNOPSIS
       ssh-copy-id [-i keyfile] [user@]hostname

DESCRIPTION
       Copy your public key to a remote server's authorized_keys
       file, enabling passwordless SSH login.

       -i FILE   use this key file (default: ~/.ssh/id_*.pub)

       Example: ssh-copy-id user@server.com

  / to search · q to quit`,

  "ssh-add": `SSH-ADD(1)

NAME
       ssh-add - add private key identities to the ssh agent

SYNOPSIS
       ssh-add [options] [file ...]

DESCRIPTION
       Add private key identities to the authentication agent.

       ssh-add           add default keys
       ssh-add file      add specific key
       ssh-add -l        list fingerprints of added keys
       ssh-add -D        delete all identities from agent

  / to search · q to quit`,

  scp: `SCP(1)

NAME
       scp - secure copy (remote file copy program)

SYNOPSIS
       scp [options] source... target

DESCRIPTION
       Copy files between hosts on a network over SSH.

       -r    recursively copy directories
       -P    port to connect to
       -i    identity file (private key)

       Example:
         scp file.txt user@host:/path/
         scp user@host:/path/file.txt ./

  / to search · q to quit`,

  rsync: `RSYNC(1)

NAME
       rsync - fast, versatile, remote (and local) file-copying tool

SYNOPSIS
       rsync [OPTION]... SRC... DEST

DESCRIPTION
       Efficiently sync files and directories, only transferring
       differences.

       -a    archive mode (preserves permissions, times, etc.)
       -v    verbose
       -z    compress during transfer
       --delete     delete files in dest not in source
       --dry-run    show what would be transferred
       -e ssh       use SSH as transport

       Example: rsync -avz ./project/ user@host:/backup/

  / to search · q to quit`,

  wget: `WGET(1)

NAME
       wget - non-interactive network downloader

SYNOPSIS
       wget [option]... [URL]...

DESCRIPTION
       Download files from the web.

       -O FILE     save to FILE
       -q          quiet mode
       -r          recursive download
       -c          continue a partial download
       --mirror    mirror a website

  / to search · q to quit`,

  ping: `PING(8)

NAME
       ping - send ICMP ECHO_REQUEST to network hosts

SYNOPSIS
       ping [options] destination

DESCRIPTION
       Test whether a host is reachable on the network.

       -c N    stop after N packets
       -i N    wait N seconds between packets
       -t N    set TTL (time to live)
       -W N    timeout in seconds

       Example: ping -c 4 google.com

  / to search · q to quit`,

  tmux: `TMUX(1)

NAME
       tmux - terminal multiplexer

SYNOPSIS
       tmux [command]

DESCRIPTION
       Manage multiple terminal sessions from a single window.

       tmux new -s name      create named session
       tmux ls               list sessions
       tmux attach -t name   reattach to session
       tmux kill-session -t name   kill session

       Inside tmux (prefix is Ctrl+b):
         Ctrl+b c    new window
         Ctrl+b n    next window
         Ctrl+b %    split vertical
         Ctrl+b "    split horizontal
         Ctrl+b d    detach

  / to search · q to quit`,

  systemctl: `SYSTEMCTL(1)

NAME
       systemctl - control the systemd system and service manager

SYNOPSIS
       systemctl [command] [unit]

DESCRIPTION
       Manage system services.

       start unit      start a service
       stop unit       stop a service
       restart unit    restart a service
       status unit     show service status
       enable unit     start at boot
       disable unit    don't start at boot
       list-units      list active units

       Example: systemctl status nginx

  / to search · q to quit`,

  journalctl: `JOURNALCTL(1)

NAME
       journalctl - query the systemd journal

SYNOPSIS
       journalctl [options]

DESCRIPTION
       View logs collected by systemd.

       -u unit    show logs for a specific service
       -f         follow new log entries (like tail -f)
       -n N       show last N entries
       --since    show entries since a time
       -p err     show only errors

       Example: journalctl -u nginx -f

  / to search · q to quit`,

  "nvidia-smi": `NVIDIA-SMI(1)

NAME
       nvidia-smi - NVIDIA System Management Interface

SYNOPSIS
       nvidia-smi [options]

DESCRIPTION
       Monitor and manage NVIDIA GPU devices.

       (no args)         show GPU status summary
       -l N              loop every N seconds
       --query-gpu=...   query specific fields
       --format=csv      output as CSV

       Common fields: gpu_name, memory.used, utilization.gpu

  / to search · q to quit`,

  python: `PYTHON(1)

NAME
       python - an interpreted, interactive programming language

SYNOPSIS
       python [options] [script.py] [args]

DESCRIPTION
       Run Python scripts or start an interactive interpreter.

       -c cmd    execute cmd as a string
       -m mod    run library module as a script
       -i        inspect interactively after running
       -V        print version
       -u        unbuffered stdout/stderr

       Example: python -m http.server 8080

  / to search · q to quit`,

  node: `NODE(1)

NAME
       node - server-side JavaScript runtime

SYNOPSIS
       node [options] [script.js] [args]

DESCRIPTION
       Run JavaScript outside the browser using the V8 engine.

       -e str    evaluate string as JavaScript
       -p str    evaluate and print result
       --inspect start the debugger
       -v        print version

  / to search · q to quit`,

  npm: `NPM(1)

NAME
       npm - node package manager

SYNOPSIS
       npm [command] [args]

DESCRIPTION
       Manage Node.js packages and run scripts.

       install     install dependencies from package.json
       start       run the start script
       test        run tests
       run NAME    run a named script
       init        create a new package.json
       ls          list installed packages
       audit       scan for vulnerabilities

  / to search · q to quit`,

  claude: `CLAUDE(1)

NAME
       claude - AI assistant for the terminal

SYNOPSIS
       claude [options] [prompt]

DESCRIPTION
       An AI-powered coding assistant that runs in your terminal.

       claude            start interactive session
       claude "prompt"   ask a one-off question
       claude -p "..."   pipe-friendly (print mode)
       /help             show available commands
       /cost             show token usage

  / to search · q to quit`,

  ll: `LL(1)

NAME
       ll - list directory contents in long format

SYNOPSIS
       ll [file...]

DESCRIPTION
       ll is a common alias for ls -la (or ls -lah).

       Shows detailed file information including permissions,
       owner, group, size, and modification date, including
       hidden files (starting with .).

       To create: alias ll="ls -la"

  / to search · q to quit`,

  nginx: `NGINX(8)

NAME
       nginx - HTTP and reverse proxy server

SYNOPSIS
       nginx [options]

DESCRIPTION
       High-performance web server, reverse proxy, and load balancer.

       -t           test configuration and exit
       -s signal    send signal (stop, quit, reload, reopen)
       -c file      set configuration file

       Config:  /etc/nginx/nginx.conf
       Sites:   /etc/nginx/sites-enabled/
       Logs:    /var/log/nginx/

       Example: nginx -t && nginx -s reload

  / to search · q to quit`,

  tree: `TREE(1)

NAME
       tree - list contents of directories in a tree-like format

SYNOPSIS
       tree [options] [directory...]

DESCRIPTION
       Recursively display directory structure as a tree.

       -L N    descend only N directories deep
       -a      show hidden files
       -d      list directories only
       -I pat  exclude files matching pattern
       --prune prune empty directories

  / to search · q to quit`,

  env: `ENV(1)

NAME
       env - run a program in a modified environment

SYNOPSIS
       env [OPTION]... [NAME=VALUE]... [COMMAND [ARG]...]

DESCRIPTION
       Print the environment or run a command with modified
       environment variables.

       env               print all environment variables
       env VAR=val cmd   run cmd with VAR set
       -i                start with an empty environment
       -u VAR            remove VAR from the environment

  / to search · q to quit`,
};

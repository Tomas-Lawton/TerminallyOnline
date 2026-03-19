import { useState, useRef, useEffect, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════════
   terminallyonline.sh — Learn the Command Line
   Inspired by OpenVim & VimGym
   ═══════════════════════════════════════════════ */

const DEVICES = {
  mac: { label: "macOS", icon: "⌘", note: "Unix native. Most commands work in Terminal.app or iTerm2.", tip: "On Mac, use brew to install tools: brew install tmux htop tree" },
  linux: { label: "Linux", icon: "⟩", note: "Native environment. Everything runs directly.", tip: "On Ubuntu/Debian use apt, on Fedora/RHEL use dnf." },
  windows: { label: "Windows", icon: "⊞", note: "Install WSL2 first (wsl --install), then everything works.", tip: "Run 'wsl --install' in PowerShell as admin, then open Ubuntu from Start." },
};

const CHAPTERS = [
  {
    id: "nav", title: "Navigation & Files", icon: "📁", color: "#4ade80", difficulty: "beginner",
    desc: "Move around the filesystem, create and manage files",
    teach: [
      "The terminal is a text interface to your filesystem. You're always 'inside' a directory. Commands take arguments (what to act on) and flags (how to act).",
      "Flags start with a dash: -l for long format, -a for all files. Combine them: ls -la. Double dash flags are verbose: --help, --recursive.",
      "Three commands you'll use constantly: pwd (where am I), ls (what's here), cd (go somewhere).",
    ],
    steps: [
      { learn: "pwd prints your current directory. You always start in your home folder after opening a terminal or SSH session.", task: "Where are you right now?", hint: "pwd", accept: ["pwd"], output: "/home/ubuntu", note: "Home directory. On Mac it's /Users/yourname. Everything starts here." },
      { learn: "ls -la lists everything in detail. -l gives permissions, size, date. -a includes hidden files (starting with dot).", task: "List all files in detail.", hint: "ls -la", accept: ["ls -la", "ls -al", "ls -lah"], output: "drwxr-xr-x  5 ubuntu ubuntu 4096 Mar 18 22:15 .\n-rw-r--r--  1 ubuntu ubuntu 3771 Mar  5 14:00 .bashrc\ndrwxr-xr-x  2 ubuntu ubuntu 4096 Mar 10 09:30 .ssh\ndrwxr-xr-x  8 ubuntu ubuntu 4096 Mar 17 16:45 project\n-rw-r--r--  1 ubuntu ubuntu  120 Mar 15 11:20 notes.md", note: "d = directory, - = file. The rwx columns show read/write/execute permissions for owner, group, others." },
      { learn: "cd changes directory. cd .. goes up. cd - goes back to where you just were. cd ~ goes home.", task: "Move into the project directory.", hint: "cd project", accept: ["cd project", "cd project/", "cd ./project"], output: "", note: "Now you're in /home/ubuntu/project. 'cd ..' goes up, 'cd -' toggles back, 'cd ~' goes home." },
      { learn: "mkdir creates directories. -p creates nested paths in one go: mkdir -p data/raw/2026.", task: "Create a new directory called logs.", hint: "mkdir logs", accept: ["mkdir logs", "mkdir -p logs"], output: "", note: "Created. mkdir -p is the safer version because it won't error if the directory already exists." },
      { learn: "cp copies files (-r for directories). mv moves or renames. rm deletes permanently.", task: "Copy config.yaml to config.backup.yaml.", hint: "cp config.yaml config.backup.yaml", accept: ["cp config.yaml config.backup.yaml"], output: "", note: "cp src dest. For directories: cp -r. mv works the same but moves/renames. rm deletes with no undo. rm -r for directories. Be careful." },
      { learn: "find searches recursively by filename, size, modification time, and more.", task: "Find all Python files in the current directory tree.", hint: "find . -name \"*.py\"", accept: ["find . -name \"*.py\"", 'find . -name "*.py"', "find . -name '*.py'"], output: "./src/train.py\n./src/inference.py\n./src/utils.py\n./tests/test_model.py", note: "find is recursive by default. Add -mtime -7 for files modified in the last 7 days. Add -size +100M for large files." },
      { learn: "du -sh shows disk usage. Sort with du -sh * | sort -rh to find what's eating space.", task: "Check disk usage in the current directory.", hint: "du -sh *", accept: ["du -sh *", "du -sh ./*"], output: "12K     config\n2.4G    data\n8.7G    models\n24K     src\n4.0K    Dockerfile", note: "Models: 8.7GB, data: 2.4GB. When your server fills up (and it will), du -sh is how you find the culprit." },
    ],
  },
  {
    id: "read", title: "Reading & Searching", icon: "🔍", color: "#60a5fa", difficulty: "beginner",
    desc: "Read files, search content, watch logs in real time",
    teach: [
      "Reading files is 80% of terminal work: checking configs, tailing logs, searching codebases, inspecting data.",
      "Use the right tool: cat for short files, less for scrolling, head/tail for previews, grep for searching.",
      "grep is probably the command you'll use most after ls and cd. It searches for patterns inside files and can search entire directory trees recursively.",
    ],
    steps: [
      { learn: "cat prints the whole file. Fine for short configs. For anything longer than a screenful, use less.", task: "Read the model config.", hint: "cat config/model.yaml", accept: ["cat config/model.yaml"], output: "model:\n  name: transformer-v2\n  hidden_size: 768\n  num_layers: 12\n  dropout: 0.1\n\ntraining:\n  batch_size: 64\n  learning_rate: 0.0001\n  epochs: 50", note: "Quick and clean. For large files, cat floods your terminal. Use less instead." },
      { learn: "less opens a file for scrolling. / to search inside, n for next match, q to quit.", task: "Open a large log file for scrolling.", hint: "less training.log", accept: ["less training.log"], output: "Epoch 1/50 - loss: 2.4532 - acc: 0.342\nEpoch 2/50 - loss: 1.8923 - acc: 0.451\nEpoch 3/50 - loss: 1.5234 - acc: 0.523\n...\n\n  / to search · n for next · q to quit", note: "less lets you scroll up and down, search, and doesn't pollute your terminal history. Way better than cat for big files." },
      { learn: "head -n N shows the first N lines. Essential for checking CSV headers and file structure.", task: "Check the first 5 lines of the training data.", hint: "head -n 5 data/train.csv", accept: ["head -n 5 data/train.csv", "head -5 data/train.csv"], output: "id,text,label,timestamp\n1,\"Earnings exceeded expectations\",positive,2026-01-15\n2,\"Revenue declined third quarter\",negative,2026-01-15\n3,\"New strategic partnership\",positive,2026-01-16\n4,\"2000 employees affected\",negative,2026-01-16", note: "First line is headers, rest is data. You'll do this every time you get a new dataset." },
      { learn: "tail -f follows a file in real time. New lines appear as they're written. Ctrl+C to stop.", task: "Watch the training log live.", hint: "tail -f training.log", accept: ["tail -f training.log"], output: "Epoch 48/50 - loss: 0.0212 - acc: 0.990\nEpoch 49/50 - loss: 0.0198 - acc: 0.991\nEpoch 50/50 - loss: 0.0187 - acc: 0.992\n█ watching for new lines... (Ctrl+C to stop)", note: "You'll use tail -f daily. Training progress, API logs, system events. tail -n 50 shows just the last 50 lines without following." },
      { learn: "grep searches for patterns. -r for recursive, -i for case insensitive, -c to count matches.", task: "Search for all CUDA errors in the logs.", hint: "grep CUDA training.log", accept: ["grep CUDA training.log", "grep \"CUDA\" training.log"], output: "Epoch 23 - CUDA error: out of memory\nEpoch 23 - CUDA: tried to allocate 2.4GB\nEpoch 38 - CUDA warning: fragmentation", note: "grep is your search engine for files. -v inverts (show non-matching lines). --include='*.py' limits to file types." },
      { learn: "grep -r searches recursively through directories. Combine with --include to filter file types.", task: "Find all files importing torch.", hint: "grep -r \"import torch\" --include=\"*.py\" .", accept: ["grep -r \"import torch\" --include=\"*.py\" .", "grep -r 'import torch' --include='*.py' ."], output: "./src/train.py:import torch\n./src/train.py:import torch.nn as nn\n./src/inference.py:import torch\n./src/utils.py:from torch.utils.data import DataLoader", note: "Essential for understanding codebases. 'Where is this used?' grep -r answers in seconds. Add -l to show only filenames." },
      { learn: "wc -l counts lines. Quick way to check dataset size without loading into Python.", task: "Count lines in the dataset.", hint: "wc -l data/train.csv", accept: ["wc -l data/train.csv"], output: "  248501 data/train.csv", note: "248,501 lines including header. So 248,500 rows. Faster than loading pandas just to check .shape." },
    ],
  },
  {
    id: "pipe", title: "Pipes & Processing", icon: "🔗", color: "#c084fc", difficulty: "intermediate",
    desc: "Chain commands together to transform data",
    teach: [
      "The pipe | sends the output of one command as input to the next. This is the core philosophy of Unix: small tools that each do one thing, chained together.",
      "Essential chain tools: sort (order lines), uniq -c (count duplicates), awk (extract columns), sed (find/replace), cut (extract fields), xargs (pass as arguments), tee (split to file and screen).",
      "Build chains incrementally. Start with one command, add a pipe, see the output change, add another pipe. Each step transforms the data further.",
    ],
    steps: [
      { learn: "The most common pipe: ps aux | grep. List all processes, then filter for what you need.", task: "Find all running Python processes.", hint: "ps aux | grep python", accept: ["ps aux | grep python"], output: "ubuntu  12345  45.2  8.3 python train.py --epochs 50\nubuntu  12478   0.3  1.2 python inference.py --port 8000\nubuntu  12901   0.0  0.0 grep python", note: "ps aux lists processes. Pipe to grep filters them. Last line is grep itself (ignore it). Two Python processes found." },
      { learn: "sort | uniq -c | sort -rn is the 'frequency count' pattern. Sorts, counts duplicates, ranks by count.", task: "Find the top 5 most frequent errors.", hint: "grep ERROR app.log | sort | uniq -c | sort -rn | head -5", accept: ["grep ERROR app.log | sort | uniq -c | sort -rn | head -5", "grep ERROR app.log | sort | uniq -c | sort -rn | head"], output: "     47 ERROR: Connection timeout\n     23 ERROR: CUDA out of memory\n     12 ERROR: Invalid input\n      8 ERROR: Checkpoint not found\n      5 ERROR: Rate limit exceeded", note: "Five tools chained: grep filters, sort orders, uniq -c counts, sort -rn ranks, head -5 caps it. Memorise this pattern, you'll use it constantly." },
      { learn: "awk splits lines by whitespace. {print $1} gives the first column, $2 the second, etc.", task: "Extract IP addresses from an access log.", hint: "awk '{print $1}' access.log | head -5", accept: ["awk '{print $1}' access.log | head -5", "awk '{print $1}' access.log"], output: "203.45.67.89\n203.45.67.89\n10.0.1.15\n185.22.33.44\n203.45.67.89", note: "In access logs: $1 is IP, $7 is URL path, $9 is status code. Chain with sort | uniq -c | sort -rn for top traffic sources." },
      { learn: "tee splits output to both a file and your screen. 2>&1 captures errors too.", task: "Run training and save output while watching it.", hint: "python train.py 2>&1 | tee training.log", accept: ["python train.py 2>&1 | tee training.log", "python train.py | tee training.log"], output: "Starting training...\nEpoch 1/50 - loss: 2.4532\nEpoch 2/50 - loss: 1.8923\n  (output → screen AND training.log)", note: "Without tee you choose: see it or save it. tee gives both. Use this for every training run." },
      { learn: "sed does find/replace on streams. 's/old/new/g' replaces all occurrences per line.", task: "Preview a config change without saving.", hint: "sed 's/localhost/0.0.0.0/g' config/server.yaml", accept: ["sed 's/localhost/0.0.0.0/g' config/server.yaml"], output: "server:\n  host: 0.0.0.0\n  port: 8000\n  db_host: 0.0.0.0:5432", note: "Without -i, sed just prints the result. Add -i to edit in place. g means all occurrences per line." },
      { learn: "xargs takes piped input and passes it as arguments. Bridges commands that don't read stdin.", task: "Find and delete all .pyc files.", hint: "find . -name \"*.pyc\" | xargs rm", accept: ["find . -name \"*.pyc\" | xargs rm", "find . -name '*.pyc' | xargs rm"], output: "", note: "find outputs filenames, xargs feeds them to rm as arguments. This pattern works for any 'find X then do Y' task." },
    ],
  },
  {
    id: "sys", title: "System & Processes", icon: "📊", color: "#f97316", difficulty: "intermediate",
    desc: "Monitor resources, manage processes, diagnose problems",
    teach: [
      "When you land on a server, assess it first: OS, RAM, disk, CPU, GPUs. These same commands diagnose problems later.",
      "Every running program is a process with a PID. You find them with ps/htop, stop them with kill, and background them with & and nohup.",
      "The key system commands: free (memory), df (disk), du (directory sizes), nvidia-smi (GPUs), htop (processes), lsof (port usage).",
    ],
    steps: [
      { learn: "free -h shows memory in human readable format. Check 'available', not 'free' since Linux caches aggressively.", task: "Check available memory.", hint: "free -h", accept: ["free -h"], output: "              total    used    free   available\nMem:           61Gi   22.1Gi   30Gi      37Gi\nSwap:            0B      0B      0B", note: "37GB available. Linux caches disk data in RAM (buff/cache) but releases it when apps need it. No swap means OOM kills are instant." },
      { learn: "nvidia-smi shows GPU model, memory, temperature, utilisation, and running processes.", task: "Check GPU status.", hint: "nvidia-smi", accept: ["nvidia-smi"], output: "| GPU  Name       Mem-Usage       GPU-Util |\n|  0   A100 80GB  12040/81920 MiB    67%   |\n|  1   A100 80GB      0/81920 MiB     0%   |\n|------------------------------------------|\n| PID   GPU  Mem      Command              |\n| 12345  0   12040MiB python train.py      |", note: "GPU 0 is training (12GB, 67%). GPU 1 is idle. 'watch -n 2 nvidia-smi' refreshes live. You'll run this constantly." },
      { learn: "lsof -i :PORT shows what process is using a port. Essential when you get 'address already in use'.", task: "Find what's on port 8000.", hint: "lsof -i :8000", accept: ["lsof -i :8000"], output: "COMMAND   PID    USER  TYPE  NAME\npython    12478  ubuntu IPv4  *:8000 (LISTEN)", note: "PID 12478 is your culprit. 'kill 12478' to free the port. 'kill -9 12478' to force it." },
      { learn: "htop is an interactive process viewer. Sort by CPU or memory, filter, kill processes visually.", task: "Open the process monitor.", hint: "htop", accept: ["htop", "top"], output: "CPU[||||||||||||       34.2%]  Mem[||||||||||||||  14.2G/61G]\n\n  PID  USER    CPU%  MEM%  COMMAND\n12345  ubuntu  45.2   8.3  python train.py\n12478  ubuntu   0.3   1.2  python inference.py\n 1234  root     0.1   0.0  nginx: master\n\n  F6:sort  F9:kill  q:quit", note: "CPU bars at top, processes below. F6 sorts by any column. F9 kills a process. q quits. Install: sudo apt install htop" },
      { learn: "kill PID sends a polite stop signal. kill -9 PID forces immediate termination.", task: "Kill the training process.", hint: "kill 12345", accept: ["kill 12345"], output: "", note: "Plain kill lets the process save state. kill -9 is instant, no cleanup. Use -9 only when regular kill doesn't work." },
      { learn: "nohup makes a process survive SSH disconnection. & runs it in the background.", task: "Start a long running job that survives disconnect.", hint: "nohup python train.py > train.log 2>&1 &", accept: ["nohup python train.py > train.log 2>&1 &", "nohup python train.py &"], output: "[1] 13579", note: "Process 13579 runs in background, survives logout. But tmux is better for this because you can reattach and see output." },
    ],
  },
  {
    id: "perm", title: "Permissions & Env", icon: "🔐", color: "#ef4444", difficulty: "intermediate",
    desc: "File permissions, ownership, and environment variables",
    teach: [
      "Linux permissions control who can read, write, and execute files. They cause constant headaches until you understand them.",
      "Permission numbers: 7=rwx, 5=r-x, 4=r--, 0=---. So chmod 755 gives owner full access, everyone else read+execute.",
      "Environment variables store config: API keys, CUDA settings, paths. They're per session unless you put them in .bashrc or .env files.",
    ],
    steps: [
      { learn: "chmod +x makes a file executable. Without it, ./script.sh gives 'Permission denied' even if the code is correct.", task: "Make the deploy script executable.", hint: "chmod +x deploy.sh", accept: ["chmod +x deploy.sh"], output: "", note: "Every shell script needs this. You'll also use: 755 (scripts), 644 (configs), 600 (secrets and SSH keys)." },
      { learn: "chmod 600 means only the owner can read/write. Essential for SSH keys and credential files.", task: "Lock down a secrets file.", hint: "chmod 600 .env.secrets", accept: ["chmod 600 .env.secrets"], output: "", note: "SSH refuses to use keys with loose permissions. Any file with API keys or passwords should be 600." },
      { learn: "chown user:group changes ownership. -R applies recursively. Common after Docker creates files as root.", task: "Take ownership of the data directory.", hint: "sudo chown -R ubuntu:ubuntu /data/", accept: ["sudo chown -R ubuntu:ubuntu /data/", "chown -R ubuntu:ubuntu /data/"], output: "", note: "Docker often creates files owned by root. chown fixes it so your app can read/write." },
      { learn: "export sets an environment variable. Programs you launch afterward can read it.", task: "Restrict training to GPU 0 only.", hint: "export CUDA_VISIBLE_DEVICES=0", accept: ["export CUDA_VISIBLE_DEVICES=0"], output: "", note: "Any Python script now only sees GPU 0. For one command: CUDA_VISIBLE_DEVICES=1 python train.py (no export needed)." },
      { learn: "source loads a file into your current shell. Used for .env files and Python virtual environments.", task: "Load environment variables from .env.", hint: "source .env", accept: ["source .env", ". .env"], output: "", note: "source runs each line in your current shell. Also activates venvs: 'source venv/bin/activate'. Shorthand: '. .env'" },
      { learn: "env shows all environment variables. Pipe to grep to find specific ones.", task: "Check CUDA environment variables.", hint: "env | grep CUDA", accept: ["env | grep CUDA"], output: "CUDA_VISIBLE_DEVICES=0\nCUDA_HOME=/usr/local/cuda-12.2\nLD_LIBRARY_PATH=/usr/local/cuda-12.2/lib64", note: "If your model can't find CUDA, check here first. Missing LD_LIBRARY_PATH is a common cause." },
    ],
  },
  {
    id: "ssh", title: "SSH & Remote Work", icon: "🌐", color: "#14b8a6", difficulty: "intermediate",
    desc: "Config, keys, tunnels, file transfer",
    teach: [
      "SSH config (at ~/.ssh/config) lets you replace 'ssh -i ~/.ssh/key.pem ubuntu@54.123.45.67' with just 'ssh gpu-box'. Life changing.",
      "SSH tunnels forward remote ports to localhost. Your GPU box runs Jupyter on 8888 but it's not exposed to the internet. Tunnels fix that.",
      "ed25519 keys are modern and secure. Generate once, deploy the public key to servers, never type a password again.",
    ],
    steps: [
      { learn: "~/.ssh/config maps aliases to full connection details. Each Host block is one server.", task: "Create an SSH config.", hint: "vim ~/.ssh/config", accept: ["vim ~/.ssh/config", "vi ~/.ssh/config", "nano ~/.ssh/config"], output: "# Add this:\n\nHost gpu-box\n    HostName 54.123.45.67\n    User ubuntu\n    IdentityFile ~/.ssh/gpu-key.pem\n\nHost prod\n    HostName api.mycompany.com\n    User deploy\n\n# Save with :wq", note: "Now 'ssh gpu-box' replaces the full command. Also works with scp: 'scp model.pt gpu-box:/data/'" },
      { learn: "SSH keys use public/private cryptography. Private stays on your machine. Public goes on servers.", task: "Generate a new SSH key.", hint: "ssh-keygen -t ed25519", accept: ["ssh-keygen -t ed25519", "ssh-keygen"], output: "Generating public/private ed25519 key pair.\nYour identification: ~/.ssh/id_ed25519\nYour public key: ~/.ssh/id_ed25519.pub", note: "ed25519 is faster and more secure than RSA. Never share the private key. The .pub file goes on servers and GitHub." },
      { learn: "ssh-copy-id deploys your public key to a server. You type the password once, then it's key-based auth forever.", task: "Deploy your key to a server.", hint: "ssh-copy-id user@server.com", accept: ["ssh-copy-id user@server.com"], output: "Number of key(s) added: 1\nNow try: ssh user@server.com", note: "Adds your public key to the server's ~/.ssh/authorized_keys. Last time you type a password for this server." },
      { learn: "-L creates a local tunnel: forward a remote port to localhost. Format: -L local:host:remote.", task: "Tunnel remote Jupyter to your browser.", hint: "ssh -L 8888:localhost:8888 gpu-box", accept: ["ssh -L 8888:localhost:8888 gpu-box"], output: "ubuntu@gpu-box:~$\n\n# Open http://localhost:8888", note: "Your local port 8888 now reaches the GPU box's port 8888 through SSH. Secure, no ports exposed." },
      { learn: "-fN runs the tunnel in the background without a shell. -f backgrounds, -N skips remote commands.", task: "Create a background tunnel.", hint: "ssh -fNL 8888:localhost:8888 gpu-box", accept: ["ssh -fNL 8888:localhost:8888 gpu-box"], output: "# Tunnel running silently.", note: "Runs in background. To close: ps aux | grep ssh to find PID, then kill it." },
      { learn: "rsync copies files efficiently. Unlike scp, it only transfers what changed.", task: "Sync model weights to the server.", hint: "rsync -avz ./weights/ gpu-box:/data/weights/", accept: ["rsync -avz ./weights/ gpu-box:/data/weights/"], output: "sending incremental file list\nmodel_v2.pt\n\nsent 2.4G bytes  received 35 bytes  48M bytes/sec", note: "-a archive mode, -v verbose, -z compress. Run again and it transfers nothing because nothing changed. Way better than scp for large directories." },
    ],
  },
  {
    id: "tmux", title: "tmux Sessions", icon: "🪟", color: "#a78bfa", difficulty: "intermediate",
    desc: "Persistent sessions, split panes, survive disconnects",
    teach: [
      "tmux creates terminal sessions that live on the server. SSH in, start tmux, run training, detach, close your laptop. Come back, reattach. Everything's still running.",
      "Inside tmux: split into panes (side by side or stacked), create windows (tabs), switch between them. All from one SSH connection.",
      "The prefix key is Ctrl+B. Press it, release, then press the action key. Every tmux shortcut starts with this prefix.",
    ],
    steps: [
      { learn: "tmux new -s NAME creates a named session. Names make it easy to find and reattach later.", task: "Create a session called 'work'.", hint: "tmux new -s work", accept: ["tmux new -s work"], output: "[work] 0:bash*\n\n# Green status bar at bottom. You're in tmux.", note: "Everything in here survives SSH disconnects. Name your sessions by task: 'training', 'debug', 'deploy'." },
      { learn: "Ctrl+B then % splits vertically (side by side). Ctrl+B then arrow keys to switch panes.", task: "Split into two vertical panes.", hint: "Ctrl+B then %", accept: ["ctrl+b %", "Ctrl+B %"], output: "┌───────────────┬───────────────┐\n│ ubuntu@gpu:~  │ ubuntu@gpu:~  │\n│ $             │ $             │\n└───────────────┴───────────────┘", note: "Left pane: training. Right pane: logs. Ctrl+B then arrow keys to move between them." },
      { learn: "Ctrl+B then \" splits horizontally (top and bottom).", task: "Split again horizontally.", hint: "Ctrl+B then \"", accept: ['ctrl+b "', 'Ctrl+B "'], output: "┌───────────────┬───────────────┐\n│               │ $ tail -f log │\n│ $ python train├───────────────┤\n│               │ $ nvidia-smi  │\n└───────────────┴───────────────┘", note: "Three panes from one SSH connection. Left: training. Top right: logs. Bottom right: GPU monitoring." },
      { learn: "Ctrl+B then D detaches. The session keeps running in the background.", task: "Detach from tmux.", hint: "Ctrl+B then D", accept: ["ctrl+b d", "Ctrl+B D", "tmux detach"], output: "[detached (from session work)]", note: "You're back in normal terminal. The session is still alive. Go surf, come back later." },
      { learn: "tmux ls lists sessions. tmux attach -t NAME reattaches.", task: "Reattach to your session.", hint: "tmux attach -t work", accept: ["tmux attach -t work", "tmux a -t work"], output: "# Back in tmux. All panes intact.\n# Training still running.", note: "Everything exactly where you left it. This is why tmux is non-negotiable for remote work." },
    ],
  },
  {
    id: "docker", title: "Docker", icon: "🐳", color: "#38bdf8", difficulty: "advanced",
    desc: "Manage containers, debug issues, clean up disk",
    teach: [
      "Docker packages your app and dependencies into containers. Your API, database, and cache each run isolated but connected.",
      "Key workflow: docker ps (what's running), docker logs (what happened), docker exec (get inside), docker compose (multi-container).",
      "The constant battle is disk space. Docker images stack up fast (your ML image might be 8GB+). docker system prune -a is your friend.",
    ],
    steps: [
      { learn: "docker ps shows running containers. -a includes stopped ones. This is always your first command.", task: "Check running containers.", hint: "docker ps", accept: ["docker ps"], output: "CONTAINER ID  IMAGE        STATUS     PORTS                  NAMES\na1b2c3d4e5f6  mymodel:v2   Up 2 days  0.0.0.0:8000->8000/tcp inference_api\nb2c3d4e5f6a1  redis:7      Up 2 days  6379/tcp               redis\nc3d4e5f6a1b2  postgres:15  Up 2 days  5432/tcp               db", note: "Three containers. Port 8000 mapped from container to host. 'docker ps -a' shows stopped ones too." },
      { learn: "docker logs -f follows container output in real time. --tail N shows the last N lines.", task: "Watch the API container logs.", hint: "docker logs -f inference_api", accept: ["docker logs -f inference_api", "docker logs inference_api"], output: "10:42:01 INFO:  Request 245ms\n10:42:03 INFO:  Request 312ms\n10:42:05 ERROR: CUDA out of memory\n10:42:06 INFO:  Falling back to CPU", note: "-f follows live. '--tail 50 -f' starts from last 50 lines then follows. Ctrl+C to stop." },
      { learn: "docker exec -it gives you a shell inside a running container for debugging.", task: "Shell into the API container.", hint: "docker exec -it inference_api bash", accept: ["docker exec -it inference_api bash"], output: "root@a1b2c3d4e5f6:/app#", note: "You're inside the container. All Linux commands work. Check files, test things. 'exit' to leave." },
      { learn: "docker stats shows live resource usage per container.", task: "Check resource usage.", hint: "docker stats", accept: ["docker stats"], output: "CONTAINER       CPU%  MEM / LIMIT          NET I/O\ninference_api  34.2%  13.8GiB / 15.0GiB   1.2GB / 890MB\nredis           0.3%  42MiB / 15.0GiB     120MB / 95MB\ndb              1.1%  256MiB / 15.0GiB    340MB / 290MB", note: "inference_api at 13.8/15GB. Dangerously close. Ctrl+C to exit." },
      { learn: "docker compose manages multi-container setups from docker-compose.yml.", task: "Restart just the API service.", hint: "docker compose restart api", accept: ["docker compose restart api", "docker-compose restart api"], output: "Restarting api ... done", note: "compose commands accept service names. 'docker compose up -d' starts all. 'docker compose logs -f' follows all." },
      { learn: "docker system prune -a removes all unused images, containers, and volumes.", task: "Reclaim disk space.", hint: "docker system prune -a", accept: ["docker system prune -a"], output: "Deleted: mymodel:v1, mymodel:v0, python:3.11\n\nTotal reclaimed space: 19.2GB", note: "19GB back. Check first with 'docker system df'. On GPU boxes you'll run this regularly." },
    ],
  },
  {
    id: "nginx", title: "Nginx", icon: "⚡", color: "#22d3ee", difficulty: "advanced",
    desc: "Reverse proxy, config, and debugging 502s",
    teach: [
      "Nginx sits in front of your services. Requests hit nginx on port 80/443, nginx forwards them to your app containers on internal ports.",
      "Typical setup: / routes to a frontend (port 3000), /api/ routes to a backend (port 8000). Nginx handles SSL, caching, and load balancing.",
      "502 Bad Gateway = nginx can't reach the backend. 504 = backend too slow. The nginx error log tells you exactly what happened.",
    ],
    steps: [
      { learn: "systemctl manages Linux services. status checks if something is running.", task: "Check if nginx is running.", hint: "systemctl status nginx", accept: ["systemctl status nginx"], output: "● nginx.service - A high performance web server\n   Active: active (running) since Mon 2026-03-17\n   Main PID: 1234 (nginx)\n   Memory: 8.2M", note: "Active and running. Also use systemctl for postgres, redis, and any system service." },
      { learn: "nginx -t validates config without applying. Always run this before reload.", task: "Test the config for errors.", hint: "sudo nginx -t", accept: ["sudo nginx -t", "nginx -t"], output: "nginx: configuration file syntax is ok\nnginx: configuration test is successful", note: "A typo can take your site down. Always: edit → test → reload." },
      { learn: "Site configs in /etc/nginx/sites-enabled/ define routing rules.", task: "Read the current routing config.", hint: "cat /etc/nginx/sites-enabled/default", accept: ["cat /etc/nginx/sites-enabled/default", "less /etc/nginx/sites-enabled/default"], output: "server {\n    listen 80;\n    server_name myapp.com;\n\n    location / {\n        proxy_pass http://localhost:3000;\n    }\n    location /api/ {\n        proxy_pass http://localhost:8000/;\n    }\n}", note: "/ → frontend (3000). /api/ → backend (8000). Trailing slash on proxy_pass strips the /api/ prefix." },
      { learn: "reload applies config changes without dropping connections.", task: "Apply config changes.", hint: "sudo systemctl reload nginx", accept: ["sudo systemctl reload nginx", "sudo nginx -s reload"], output: "", note: "Graceful. No dropped connections. Use restart only if fundamentally broken." },
      { learn: "The error log tells you exactly why requests fail.", task: "Debug a 502 error.", hint: "tail -f /var/log/nginx/error.log", accept: ["tail -f /var/log/nginx/error.log", "tail -n 50 /var/log/nginx/error.log"], output: "[error] connect() failed (111: Connection refused)\n  upstream: \"http://127.0.0.1:8000/predict\"", note: "Connection refused = backend is down. Fix: restart the Docker container. Nginx error log is always your first stop." },
    ],
  },
  {
    id: "boss", title: "🔥 Production Incident", icon: "🚨", color: "#ef4444", difficulty: "capstone",
    desc: "11pm. API is down. Everything you learned, combined.",
    teach: [
      "This is the capstone. Your team alerts you: 502 errors on the inference API. Open your terminal and fix it.",
      "The pattern: connect → tmux → assess → diagnose → fix → verify. You've practiced every one of these steps.",
      "Stay calm. Work systematically. tmux first so nothing is lost if your connection drops.",
    ],
    steps: [
      { learn: "SSH config alias gets you in fast.", task: "Connect to production.", hint: "ssh prod", accept: ["ssh prod"], output: "deploy@prod:~$", note: "Two words. You're in." },
      { learn: "Always start tmux during incidents. If WiFi drops mid-fix, just reattach.", task: "Start an incident tmux session.", hint: "tmux new -s incident", accept: ["tmux new -s incident"], output: "[incident] 0:bash*", note: "Protected. Everything from here is safe." },
      { learn: "Quick health check. If memory is surprisingly low, something big stopped running.", task: "Check memory.", hint: "free -h", accept: ["free -h"], output: "              total    used    free   available\nMem:           15Gi   2.1Gi    11Gi      12Gi", note: "Only 2GB used on a box that should be running a 14GB model. Something's dead." },
      { learn: "docker ps -a reveals stopped containers. Exit code 137 = OOM killed.", task: "Find the crashed container.", hint: "docker ps -a", accept: ["docker ps -a"], output: "CONTAINER ID  IMAGE        STATUS                      NAMES\na1b2c3d4e5f6  redis:7      Up 2 days                   redis\nf6e5d4c3b2a1  mymodel:v2   Exited (137) 23 min ago     inference_api", note: "Exit 137 = OOM kill. The kernel terminated it 23 minutes ago." },
      { learn: "Container logs persist after death. Check what happened before it crashed.", task: "Read the crash logs.", hint: "docker logs inference_api --tail 20", accept: ["docker logs inference_api --tail 20", "docker logs inference_api"], output: "22:17:42 INFO:  Model loaded. Memory: 14.2GB\n22:18:03 WARN:  Memory at 95%\n22:18:05 INFO:  Processing batch of 64\n22:18:06 FATAL: Killed", note: "14.2GB model on 15GB box. Heavy load pushed it over. Tomorrow: reduce batch size, add limits. Now: restart." },
      { learn: "docker restart brings a stopped container back.", task: "Restart the API.", hint: "docker restart inference_api", accept: ["docker restart inference_api"], output: "inference_api", note: "Starting up. Give it a few seconds to load the model." },
      { learn: "curl the health endpoint to confirm recovery.", task: "Verify the API is back.", hint: "curl localhost:8000/health", accept: ["curl localhost:8000/health", "curl http://localhost:8000/health"], output: "{\"status\":\"healthy\",\"model\":\"v2\",\"uptime\":\"14s\"}", note: "API is live. 502s stop. Incident resolved. Write the postmortem tomorrow." },
    ],
  },
];

const norm = s => s.trim().toLowerCase().replace(/\s+/g, " ");

export default function TerminalGym() {
  const [device, setDevice] = useState(null);
  const [screen, setScreen] = useState("landing");
  const [chIdx, setChIdx] = useState(0);
  const [stIdx, setStIdx] = useState(0);
  const [input, setInput] = useState("");
  const [hist, setHist] = useState([]);
  const [done, setDone] = useState(new Set());
  const [hint, setHint] = useState(false);
  const [shake, setShake] = useState(false);
  const [cmdH, setCmdH] = useState([]);
  const [cmdI, setCmdI] = useState(-1);
  const [showInfo, setShowInfo] = useState(false);
  const [navIdx, setNavIdx] = useState(0);
  const inRef = useRef(null);
  const scRef = useRef(null);
  const [mob, setMob] = useState(false);

  useEffect(() => { const c = () => setMob(window.innerWidth < 640); c(); window.addEventListener("resize", c); return () => window.removeEventListener("resize", c); }, []);
  useEffect(() => { if (scRef.current) scRef.current.scrollTop = scRef.current.scrollHeight; }, [hist, stIdx]);
  useEffect(() => { if (screen === "lesson" && inRef.current) inRef.current.focus(); }, [stIdx, screen]);

  // Reset nav index when screen changes
  useEffect(() => { setNavIdx(0); }, [screen]);

  // Flatten chapters for menu keyboard nav
  const menuItems = useMemo(() => {
    const items = [];
    const groups = [
      { ids: ["nav", "read", "pipe"] },
      { ids: ["sys", "perm"] },
      { ids: ["ssh", "tmux"] },
      { ids: ["docker", "nginx"] },
      { ids: ["boss"] },
    ];
    groups.forEach(g => g.ids.forEach(id => {
      const ci = CHAPTERS.findIndex(c => c.id === id);
      if (ci >= 0) items.push({ type: "chapter", idx: ci });
    }));
    items.push({ type: "sandbox" });
    return items;
  }, []);

  // Global keyboard handler for all screens
  useEffect(() => {
    const deviceKeys = Object.keys(DEVICES);
    const handler = (e) => {
      if (showInfo) { if (e.key === "Escape") setShowInfo(false); return; }

      if (screen === "landing") {
        if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); setNavIdx(i => Math.min(i + 1, deviceKeys.length - 1)); }
        else if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); setNavIdx(i => Math.max(i - 1, 0)); }
        else if (e.key === "Enter") { e.preventDefault(); setDevice(deviceKeys[navIdx]); setScreen("menu"); }
        else if (e.key === "1") { setDevice("mac"); setScreen("menu"); }
        else if (e.key === "2") { setDevice("linux"); setScreen("menu"); }
        else if (e.key === "3") { setDevice("windows"); setScreen("menu"); }
        else if (e.key === "?") setShowInfo(true);
      }

      else if (screen === "menu") {
        if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); setNavIdx(i => Math.min(i + 1, menuItems.length - 1)); }
        else if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); setNavIdx(i => Math.max(i - 1, 0)); }
        else if (e.key === "Enter") {
          e.preventDefault();
          const item = menuItems[navIdx];
          if (item.type === "sandbox") setScreen("sandbox");
          else startCh(item.idx);
        }
        else if (e.key >= "1" && e.key <= "9") {
          const idx = parseInt(e.key) - 1;
          if (idx < CHAPTERS.length) startCh(idx);
        }
        else if (e.key === "0") setScreen("sandbox");
        else if (e.key === "?" || e.key === "i") setShowInfo(true);
        else if (e.key === "Escape" || e.key === "Backspace") setScreen("landing");
      }

      else if (screen === "sandbox") {
        if (e.key === "Escape") { setScreen("menu"); e.preventDefault(); }
      }

      else if (screen === "lesson") {
        // Lesson keyboard is handled by input field, only intercept Escape
        if (e.key === "Escape" && document.activeElement !== inRef.current) { setScreen("menu"); setHist([]); setHint(false); setInput(""); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [screen, navIdx, showInfo, menuItems]);

  const ch = CHAPTERS[chIdx];
  const st = ch?.steps[stIdx];
  const lessonDone = stIdx >= (ch?.steps.length || 0);

  const go = useCallback(() => {
    if (!input.trim() || lessonDone) return;
    const c = norm(input);

    if (c === "help") { setHist(h => [...h, { t: "in", v: input.trim() }, { t: "help" }]); setInput(""); return; }
    if (c === "clear") { setHist([]); setInput(""); return; }

    const ok = st.accept.some(a => norm(a) === c);
    setCmdH(h => [input.trim(), ...h]); setCmdI(-1);

    if (ok) {
      setHist(h => [...h, { t: "in", v: input.trim() }, ...(st.output ? [{ t: "out", v: st.output }] : []), { t: "note", v: st.note }]);
      setHint(false); setInput("");
      const nx = stIdx + 1;
      if (nx >= ch.steps.length) { setDone(d => new Set([...d, chIdx])); setHist(h => [...h, { t: "done", v: ch.title }]); }
      setStIdx(nx);
    } else {
      setShake(true); setTimeout(() => setShake(false), 500);
      setHist(h => [...h, { t: "in", v: input.trim() }, { t: "err", v: "Command not recognised. Tab for hint." }]);
      setInput("");
    }
  }, [input, st, stIdx, ch, lessonDone, chIdx]);

  const kd = e => {
    if (e.key === "Enter") { e.preventDefault(); go(); }
    if (e.key === "Tab") { e.preventDefault(); setHint(true); }
    if (e.key === "Escape") { e.preventDefault(); inRef.current?.blur(); setScreen("menu"); setHist([]); setHint(false); setInput(""); }
    if (e.key === "ArrowUp") { e.preventDefault(); if (cmdH.length) { const n = Math.min(cmdI + 1, cmdH.length - 1); setCmdI(n); setInput(cmdH[n]); } }
    if (e.key === "ArrowDown") { e.preventDefault(); if (cmdI > 0) { setCmdI(cmdI - 1); setInput(cmdH[cmdI - 1]); } else { setCmdI(-1); setInput(""); } }
  };

  const startCh = i => { setChIdx(i); setStIdx(0); setHist([]); setHint(false); setInput(""); setCmdH([]); setCmdI(-1); setScreen("lesson"); };
  const focus = () => { if (inRef.current) inRef.current.focus(); };

  const mono = "'SF Mono','Fira Code','JetBrains Mono','Menlo','Consolas',monospace";
  const bg = "#08080a";

  const totalS = CHAPTERS.reduce((a, c) => a + c.steps.length, 0);
  const doneS = [...done].reduce((a, i) => a + CHAPTERS[i].steps.length, 0);

  // ── INFO MODAL ──
  const InfoModal = () => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowInfo(false)}>
      <div style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: mob ? 24 : 36, maxWidth: 500, width: "100%", fontFamily: mono, color: "#999", fontSize: 13, lineHeight: 1.7 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ color: "#eee", fontSize: 18, margin: "0 0 6px", fontWeight: 700 }}>terminally<span style={{ color: "#4ade80" }}>online</span><span style={{ color: "#555" }}>.sh</span></h2>
        <p style={{ color: "#555", margin: "0 0 20px", fontSize: 12 }}>Learn the command line interactively</p>

        <p><span style={{ color: "#bbb" }}>What is this?</span> An interactive tutorial teaching the command line: bash (the shell), Unix commands, and tools like Docker, SSH, nginx. Type real commands, build muscle memory.</p>

        <p style={{ marginTop: 16 }}><span style={{ color: "#bbb" }}>How to use:</span> Pick a chapter. Read the teaching notes. Type the command for each step. Press Tab if you need a hint. Arrow keys recall previous commands. Type 'help' in any lesson for tips. Type 'clear' to reset the terminal.</p>

        <p style={{ marginTop: 16 }}><span style={{ color: "#bbb" }}>Practice tip:</span> Don't just complete each step once. Come back and try from memory. Real learning happens when your fingers know the command before your brain finishes the thought.</p>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #1a1a1a" }}>
          <p style={{ color: "#bbb", margin: "0 0 10px", fontSize: 12, fontWeight: 700 }}>Keyboard shortcuts</p>
          <div style={{ fontSize: 12, color: "#666", lineHeight: 2 }}>
            <div><span style={{ color: "#888", display: "inline-block", width: 80 }}>↑ ↓ / j k</span> Navigate menus</div>
            <div><span style={{ color: "#888", display: "inline-block", width: 80 }}>Enter</span> Select item</div>
            <div><span style={{ color: "#888", display: "inline-block", width: 80 }}>1-9 / 0</span> Jump to chapter / sandbox</div>
            <div><span style={{ color: "#888", display: "inline-block", width: 80 }}>Esc</span> Go back</div>
            <div><span style={{ color: "#888", display: "inline-block", width: 80 }}>?</span> Open this help</div>
            <div style={{ marginTop: 6, borderTop: "1px solid #1a1a1a", paddingTop: 6 }}><span style={{ color: "#888", display: "inline-block", width: 80 }}>Tab</span> Show hint (in lessons)</div>
            <div><span style={{ color: "#888", display: "inline-block", width: 80 }}>↑ ↓</span> Command history (in lessons)</div>
          </div>
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #1a1a1a" }}>
          <a href="https://buymeacoffee.com/tomaslawton" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: "#1a2e1a", border: "1px solid #2d4a2d", color: "#4ade80", padding: "8px 16px", borderRadius: 6, fontSize: 13, textDecoration: "none", fontWeight: 600, fontFamily: mono }}>☕ Buy me a coffee</a>
        </div>

        <div style={{ marginTop: 20, fontSize: 11, color: "#333" }}>
          Inspired by <a href="https://openvim.com" target="_blank" rel="noopener noreferrer" style={{ color: "#555" }}>OpenVim</a> & <a href="https://www.vimgym.dev" target="_blank" rel="noopener noreferrer" style={{ color: "#555" }}>VimGym</a>
        </div>

        <button onClick={() => setShowInfo(false)} style={{ marginTop: 20, background: "none", border: "1px solid #222", color: "#555", padding: "6px 16px", borderRadius: 5, cursor: "pointer", fontFamily: mono, fontSize: 12 }}>Close <span style={{ color: "#333" }}>Esc</span></button>
      </div>
    </div>
  );

  // ── SANDBOX ──
  const [sbHist, setSbHist] = useState([]);
  const [sbInput, setSbInput] = useState("");
  const [sbCwd, setSbCwd] = useState("/home/ubuntu");
  const [sbCmdH, setSbCmdH] = useState([]);
  const [sbCmdI, setSbCmdI] = useState(-1);
  const sbRef = useRef(null);
  const sbScroll = useRef(null);

  useEffect(() => { if (screen === "sandbox" && sbRef.current) sbRef.current.focus(); }, [screen, sbHist]);
  useEffect(() => { if (sbScroll.current) sbScroll.current.scrollTop = sbScroll.current.scrollHeight; }, [sbHist]);

  const FS = useMemo(() => ({
    "/home/ubuntu": { type: "dir", children: [".bashrc", ".ssh", "project", "notes.md", "scripts"] },
    "/home/ubuntu/.bashrc": { type: "file", content: "# ~/.bashrc\nexport PATH=$PATH:/usr/local/bin\nalias ll='ls -la'\nalias gs='git status'\n\n# CUDA\nexport CUDA_HOME=/usr/local/cuda-12.2" },
    "/home/ubuntu/.ssh": { type: "dir", children: ["id_ed25519", "id_ed25519.pub", "config"] },
    "/home/ubuntu/.ssh/id_ed25519.pub": { type: "file", content: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHj7k... tomas@work" },
    "/home/ubuntu/.ssh/config": { type: "file", content: "Host gpu-box\n    HostName 54.123.45.67\n    User ubuntu\n    IdentityFile ~/.ssh/gpu-key.pem\n\nHost prod\n    HostName api.mycompany.com\n    User deploy" },
    "/home/ubuntu/notes.md": { type: "file", content: "# Project Notes\n\n- Model v2 deployed to production\n- Batch size reduced to 32 after OOM incident\n- Next: add monitoring alerts" },
    "/home/ubuntu/scripts": { type: "dir", children: ["deploy.sh", "backup.sh"] },
    "/home/ubuntu/scripts/deploy.sh": { type: "file", content: "#!/bin/bash\nset -e\n\necho 'Building Docker image...'\ndocker build -t mymodel:$1 .\n\necho 'Pushing to registry...'\ndocker push registry.mycompany.com/mymodel:$1\n\necho 'Deploying...'\nssh prod 'docker pull registry.mycompany.com/mymodel:'$1\nssh prod 'docker compose up -d'" },
    "/home/ubuntu/scripts/backup.sh": { type: "file", content: "#!/bin/bash\nDATE=$(date +%Y%m%d)\ntar -czf /data/backups/models_$DATE.tar.gz /data/models/\necho \"Backup complete: models_$DATE.tar.gz\"" },
    "/home/ubuntu/project": { type: "dir", children: ["src", "config", "data", "models", "Dockerfile", "docker-compose.yml", "requirements.txt", "training.log", "app.log"] },
    "/home/ubuntu/project/src": { type: "dir", children: ["train.py", "inference.py", "utils.py"] },
    "/home/ubuntu/project/src/train.py": { type: "file", content: "import torch\nimport torch.nn as nn\nfrom torch.utils.data import DataLoader\nfrom utils import load_config, setup_logging\n\ndef train(config):\n    model = TransformerV2(config)\n    model = model.cuda()\n    optimizer = torch.optim.AdamW(model.parameters(), lr=config['lr'])\n    \n    for epoch in range(config['epochs']):\n        for batch in dataloader:\n            loss = model(batch)\n            loss.backward()\n            optimizer.step()\n        print(f'Epoch {epoch}: loss={loss:.4f}')" },
    "/home/ubuntu/project/src/inference.py": { type: "file", content: "import torch\nfrom fastapi import FastAPI\n\napp = FastAPI()\nmodel = None\n\n@app.on_event('startup')\nasync def load_model():\n    global model\n    model = torch.load('/models/v2/model.pt')\n    model.eval()\n\n@app.post('/predict')\nasync def predict(text: str):\n    with torch.no_grad():\n        result = model(tokenize(text))\n    return {'prediction': result}" },
    "/home/ubuntu/project/src/utils.py": { type: "file", content: "import yaml\nimport logging\nfrom torch.utils.data import DataLoader\n\ndef load_config(path):\n    with open(path) as f:\n        return yaml.safe_load(f)\n\ndef setup_logging(level='INFO'):\n    logging.basicConfig(level=level)" },
    "/home/ubuntu/project/config": { type: "dir", children: ["model.yaml", "server.yaml"] },
    "/home/ubuntu/project/config/model.yaml": { type: "file", content: "model:\n  name: transformer-v2\n  hidden_size: 768\n  num_layers: 12\n  num_heads: 12\n  dropout: 0.1\n\ntraining:\n  batch_size: 64\n  learning_rate: 0.0001\n  epochs: 50\n  warmup_steps: 1000" },
    "/home/ubuntu/project/config/server.yaml": { type: "file", content: "server:\n  host: localhost\n  port: 8000\n  workers: 4\n  db_host: localhost:5432\n  redis_host: localhost:6379" },
    "/home/ubuntu/project/data": { type: "dir", children: ["train.csv", "val.csv"] },
    "/home/ubuntu/project/data/train.csv": { type: "file", content: "id,text,label,timestamp\n1,\"Earnings exceeded expectations\",positive,2026-01-15\n2,\"Revenue declined third quarter\",negative,2026-01-15\n3,\"New strategic partnership announced\",positive,2026-01-16\n4,\"2000 employees affected by layoffs\",negative,2026-01-16\n5,\"Stock price reached all-time high\",positive,2026-01-17" },
    "/home/ubuntu/project/models": { type: "dir", children: ["v1", "v2"] },
    "/home/ubuntu/project/models/v1": { type: "dir", children: ["model.pt", "config.json"] },
    "/home/ubuntu/project/models/v2": { type: "dir", children: ["model.pt", "config.json", "tokenizer.json"] },
    "/home/ubuntu/project/Dockerfile": { type: "file", content: "FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY src/ ./src/\nCOPY config/ ./config/\nEXPOSE 8000\nCMD [\"uvicorn\", \"src.inference:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]" },
    "/home/ubuntu/project/docker-compose.yml": { type: "file", content: "version: '3.8'\nservices:\n  api:\n    build: .\n    ports:\n      - '8000:8000'\n    volumes:\n      - /data/models:/models\n    deploy:\n      resources:\n        reservations:\n          devices:\n            - capabilities: [gpu]\n  redis:\n    image: redis:7\n    ports:\n      - '6379:6379'\n  db:\n    image: postgres:15\n    environment:\n      POSTGRES_PASSWORD: secret\n    volumes:\n      - pgdata:/var/lib/postgresql/data\nvolumes:\n  pgdata:" },
    "/home/ubuntu/project/requirements.txt": { type: "file", content: "torch==2.2.0\nfastapi==0.109.0\nuvicorn==0.27.0\npyyaml==6.0.1\nnumpy==1.26.3\ntransformers==4.37.0" },
    "/home/ubuntu/project/training.log": { type: "file", content: "Epoch 1/50 - loss: 2.4532 - acc: 0.342 - val_loss: 2.389\nEpoch 2/50 - loss: 1.8923 - acc: 0.451 - val_loss: 1.823\nEpoch 3/50 - loss: 1.5234 - acc: 0.523 - val_loss: 1.489\nEpoch 4/50 - loss: 1.2891 - acc: 0.589 - val_loss: 1.245\nEpoch 5/50 - loss: 1.0234 - acc: 0.641 - val_loss: 1.012\nEpoch 23/50 - CUDA error: out of memory\nEpoch 23/50 - CUDA: tried to allocate 2.4GB\nEpoch 24/50 - loss: 0.1823 - acc: 0.934 - val_loss: 0.198\nEpoch 38/50 - CUDA warning: memory fragmentation detected\nEpoch 48/50 - loss: 0.0212 - acc: 0.990 - val_loss: 0.031\nEpoch 49/50 - loss: 0.0198 - acc: 0.991 - val_loss: 0.029\nEpoch 50/50 - loss: 0.0187 - acc: 0.992 - val_loss: 0.027" },
    "/home/ubuntu/project/app.log": { type: "file", content: "10:42:01 INFO:  Server started on 0.0.0.0:8000\n10:42:01 INFO:  Model loaded. Memory: 14.2GB\n10:42:03 INFO:  Request processed in 245ms\n10:42:05 ERROR: Connection timeout to database\n10:42:06 INFO:  Request processed in 312ms\n10:42:07 ERROR: CUDA out of memory\n10:42:08 ERROR: Connection timeout to database\n10:42:09 INFO:  Request processed in 189ms\n10:42:10 ERROR: Invalid input format\n10:42:11 ERROR: Connection timeout to database\n10:42:12 INFO:  Request processed in 267ms\n10:42:13 ERROR: CUDA out of memory\n10:42:14 ERROR: Connection timeout to database" },
  }), []);

  const resolvePath = (p) => {
    if (p.startsWith("/")) return p;
    if (p.startsWith("~/")) return "/home/ubuntu" + p.slice(1);
    const parts = (sbCwd + "/" + p).split("/").filter(Boolean);
    const resolved = [];
    for (const part of parts) { if (part === "..") resolved.pop(); else if (part !== ".") resolved.push(part); }
    return "/" + resolved.join("/");
  };

  const sbExec = useCallback((raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    if (cmd === "clear") { setSbHist([]); return null; }
    if (cmd === "help") return "Available commands: ls, cd, pwd, cat, head, tail, grep, wc, find, tree, echo, whoami, env, which, history, clear\n\nThis is a virtual filesystem sandbox. Practice commands freely.\nNot all flags are supported — this is for building muscle memory with core commands.";
    if (cmd === "pwd") return sbCwd;
    if (cmd === "whoami") return "ubuntu";
    if (cmd === "echo") return args.join(" ").replace(/["']/g, "").replace(/\$HOME/g, "/home/ubuntu").replace(/\$USER/g, "ubuntu");
    if (cmd === "which") { const bins = { python: "/usr/bin/python3", node: "/usr/bin/node", docker: "/usr/bin/docker", nginx: "/usr/sbin/nginx", vim: "/usr/bin/vim", git: "/usr/bin/git", ssh: "/usr/bin/ssh", curl: "/usr/bin/curl", grep: "/usr/bin/grep" }; return bins[args[0]] || `${args[0]} not found`; }
    if (cmd === "env") { const envs = "HOME=/home/ubuntu\nUSER=ubuntu\nPATH=/usr/local/bin:/usr/bin:/bin\nSHELL=/bin/bash\nCUDA_HOME=/usr/local/cuda-12.2\nCUDA_VISIBLE_DEVICES=0,1\nLD_LIBRARY_PATH=/usr/local/cuda-12.2/lib64\nPYTHONPATH=/home/ubuntu/project"; if (args.length && args[0] === "|" && args[1] === "grep") { return envs.split("\n").filter(l => l.toLowerCase().includes(args.slice(2).join(" ").toLowerCase())).join("\n") || "(no matches)"; } return envs; }
    if (cmd === "history") return sbCmdH.map((c, i) => `  ${i + 1}  ${c}`).join("\n") || "(empty)";

    if (cmd === "cd") {
      const target = args[0] || "/home/ubuntu";
      if (target === "-") return ""; // simplified
      const p = resolvePath(target);
      const node = FS[p];
      if (!node || node.type !== "dir") return `cd: ${target}: No such directory`;
      setSbCwd(p);
      return "";
    }

    if (cmd === "ls") {
      const showAll = args.includes("-a") || args.includes("-la") || args.includes("-al") || args.includes("-lah");
      const showLong = args.includes("-l") || args.includes("-la") || args.includes("-al") || args.includes("-lah");
      const pathArg = args.find(a => !a.startsWith("-"));
      const target = pathArg ? resolvePath(pathArg) : sbCwd;
      const node = FS[target];
      if (!node || node.type !== "dir") return `ls: cannot access '${pathArg || "."}': No such file or directory`;
      let items = [...node.children];
      if (showAll) items = [".", "..", ...items];
      if (showLong) {
        return items.map(name => {
          if (name === "." || name === "..") return `drwxr-xr-x  ubuntu ubuntu 4096 Mar 18 22:15 ${name}`;
          const childPath = target + "/" + name;
          const child = FS[childPath];
          if (child?.type === "dir") return `drwxr-xr-x  ubuntu ubuntu 4096 Mar 17 16:45 ${name}`;
          return `-rw-r--r--  ubuntu ubuntu ${(child?.content?.length || 120).toString().padStart(4)} Mar 15 11:20 ${name}`;
        }).join("\n");
      }
      return items.join("  ");
    }

    if (cmd === "cat") {
      if (!args[0]) return "cat: missing operand";
      const p = resolvePath(args[0]);
      const node = FS[p];
      if (!node) return `cat: ${args[0]}: No such file or directory`;
      if (node.type === "dir") return `cat: ${args[0]}: Is a directory`;
      return node.content;
    }

    if (cmd === "head") {
      let n = 10; let file = args[0];
      if (args[0] === "-n" && args[1]) { n = parseInt(args[1]); file = args[2]; }
      else if (args[0]?.startsWith("-")) { n = parseInt(args[0].slice(1)); file = args[1]; }
      if (!file) return "head: missing operand";
      const p = resolvePath(file);
      const node = FS[p];
      if (!node || node.type === "dir") return `head: ${file}: No such file or directory`;
      return node.content.split("\n").slice(0, n).join("\n");
    }

    if (cmd === "tail") {
      let n = 10; let file = args[0];
      if (args[0] === "-f") { file = args[1]; if (!file) return "tail: missing operand"; const p = resolvePath(file); const node = FS[p]; if (!node) return `tail: ${file}: No such file`; return node.content.split("\n").slice(-n).join("\n") + "\n█ watching... (Ctrl+C to stop)"; }
      if (args[0] === "-n" && args[1]) { n = parseInt(args[1]); file = args[2]; }
      else if (args[0]?.startsWith("-")) { n = parseInt(args[0].slice(1)); file = args[1]; }
      if (!file) return "tail: missing operand";
      const p = resolvePath(file);
      const node = FS[p];
      if (!node || node.type === "dir") return `tail: ${file}: No such file`;
      return node.content.split("\n").slice(-n).join("\n");
    }

    if (cmd === "grep") {
      const flags = args.filter(a => a.startsWith("-"));
      const nonFlags = args.filter(a => !a.startsWith("-"));
      const pattern = nonFlags[0]; const file = nonFlags[1];
      if (!pattern) return "grep: missing pattern";
      if (!file) return "grep: missing file operand";
      const caseI = flags.includes("-i");
      const countOnly = flags.includes("-c");
      const p = resolvePath(file);
      const node = FS[p];
      if (!node || node.type === "dir") return `grep: ${file}: No such file`;
      const lines = node.content.split("\n").filter(l => caseI ? l.toLowerCase().includes(pattern.toLowerCase()) : l.includes(pattern));
      if (countOnly) return String(lines.length);
      return lines.join("\n") || "(no matches)";
    }

    if (cmd === "wc") {
      if (args[0] === "-l" && args[1]) {
        const p = resolvePath(args[1]);
        const node = FS[p];
        if (!node || node.type === "dir") return `wc: ${args[1]}: No such file`;
        return `  ${node.content.split("\n").length} ${args[1]}`;
      }
      return "Usage: wc -l <file>";
    }

    if (cmd === "find") {
      const root = args[0] || ".";
      const nameIdx = args.indexOf("-name");
      const pattern = nameIdx >= 0 ? args[nameIdx + 1]?.replace(/["']/g, "") : null;
      const rootPath = resolvePath(root);
      const results = [];
      for (const [path, node] of Object.entries(FS)) {
        if (!path.startsWith(rootPath)) continue;
        const name = path.split("/").pop();
        if (pattern) {
          const regex = new RegExp("^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
          if (regex.test(name)) results.push(path.replace(rootPath, root === "." ? "." : root));
        } else { results.push(path.replace(rootPath, root === "." ? "." : root)); }
      }
      return results.join("\n") || "(no matches)";
    }

    if (cmd === "tree") {
      let depth = 2;
      if (args[0] === "-L" && args[1]) depth = parseInt(args[1]);
      const target = args.find(a => !a.startsWith("-") && a !== args[args.indexOf("-L") + 1]) || ".";
      const rootPath = resolvePath(target);
      const node = FS[rootPath];
      if (!node || node.type !== "dir") return `tree: ${target}: No such directory`;
      const lines = [target];
      const buildTree = (path, prefix, d) => {
        const n = FS[path]; if (!n || n.type !== "dir" || d >= depth) return;
        n.children.forEach((child, i) => {
          const isLast = i === n.children.length - 1;
          lines.push(prefix + (isLast ? "└── " : "├── ") + child);
          if (d + 1 < depth) buildTree(path + "/" + child, prefix + (isLast ? "    " : "│   "), d + 1);
        });
      };
      buildTree(rootPath, "", 0);
      return lines.join("\n");
    }

    if (cmd === "mkdir" || cmd === "touch" || cmd === "cp" || cmd === "mv" || cmd === "rm" || cmd === "chmod" || cmd === "chown") return `(simulated) ${trimmed} — OK`;
    if (cmd === "docker") return "CONTAINER ID  IMAGE        STATUS     PORTS                  NAMES\na1b2c3d4e5f6  mymodel:v2   Up 2 days  0.0.0.0:8000->8000/tcp inference_api\nb2c3d4e5f6a1  redis:7      Up 2 days  6379/tcp               redis";
    if (cmd === "nvidia-smi") return "| GPU  Name       Mem-Usage       GPU-Util |\n|  0   A100 80GB  12040/81920 MiB    67%   |\n|  1   A100 80GB      0/81920 MiB     0%   |";
    if (cmd === "free") return "              total    used    free   available\nMem:           61Gi   22.1Gi   30Gi      37Gi\nSwap:            0B      0B      0B";
    if (cmd === "df") return "Filesystem      Size  Used Avail Use% Mounted on\n/dev/nvme0n1p1  200G   42G  158G  21% /\n/dev/nvme1n1    500G  312G  188G  63% /data";
    if (cmd === "uptime") return " 10:42:13 up 14 days, 3:22, 2 users, load average: 0.42, 0.38, 0.35";
    if (cmd === "htop" || cmd === "top") return "CPU[||||||||||||       34.2%]  Mem[||||||||||||||  14.2G/61G]\n\n  PID  USER    CPU%  MEM%  COMMAND\n12345  ubuntu  45.2   8.3  python train.py\n12478  ubuntu   0.3   1.2  python inference.py\n\n  q to quit";
    if (cmd === "ps") return "ubuntu  12345 45.2 8.3 python train.py --epochs 50\nubuntu  12478  0.3 1.2 python inference.py --port 8000";
    if (cmd === "ssh" || cmd === "scp" || cmd === "rsync" || cmd === "tmux" || cmd === "curl" || cmd === "ping" || cmd === "wget") return `(simulated) ${trimmed} — OK`;

    return `${cmd}: command not found. Type 'help' for available commands.`;
  }, [sbCwd, FS, sbCmdH]);

  const sbGo = useCallback(() => {
    const v = sbInput.trim();
    if (!v) return;
    setSbCmdH(h => [v, ...h]);
    setSbCmdI(-1);
    const result = sbExec(v);
    if (result === null) { setSbInput(""); return; } // clear was called
    setSbHist(h => [...h, { prompt: `ubuntu@server:${sbCwd.replace("/home/ubuntu", "~")}$`, cmd: v }, ...(result ? [{ output: result }] : [])]);
    setSbInput("");
  }, [sbInput, sbExec, sbCwd]);

  const sbKd = (e) => {
    if (e.key === "Enter") { e.preventDefault(); sbGo(); }
    if (e.key === "Escape") { e.preventDefault(); sbRef.current?.blur(); setScreen("menu"); }
    if (e.key === "ArrowUp") { e.preventDefault(); if (sbCmdH.length) { const n = Math.min(sbCmdI + 1, sbCmdH.length - 1); setSbCmdI(n); setSbInput(sbCmdH[n]); } }
    if (e.key === "ArrowDown") { e.preventDefault(); if (sbCmdI > 0) { setSbCmdI(sbCmdI - 1); setSbInput(sbCmdH[sbCmdI - 1]); } else { setSbCmdI(-1); setSbInput(""); } }
    if (e.key === "Tab") { e.preventDefault(); }
  };

  if (screen === "sandbox") {
    const sbPrompt = `ubuntu@server:${sbCwd.replace("/home/ubuntu", "~")}$`;
    return (
      <div style={{ minHeight: "100vh", background: bg, color: "#c8c8c8", fontFamily: mono, display: "flex", flexDirection: "column" }} onClick={() => sbRef.current?.focus()}>
        <div style={{ padding: mob ? "8px 12px" : "8px 20px", borderBottom: "1px solid #111", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: "#0a0a0e" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setScreen("menu")} style={{ background: "none", border: "1px solid #1a1a1e", color: "#444", fontSize: 11, cursor: "pointer", padding: "4px 10px", borderRadius: 5, fontFamily: mono }}>← chapters <span style={{ color: "#2a2a2a" }}>Esc</span></button>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#bbb" }}>Free Practice</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#f97316", background: "#1a1008", padding: "2px 6px", borderRadius: 3, border: "1px solid #2a1a0a" }}>BETA</span>
          </div>
          <button onClick={() => { setSbHist([]); setSbCwd("/home/ubuntu"); }} style={{ background: "none", border: "1px solid #1a1a1e", color: "#333", fontSize: 11, cursor: "pointer", padding: "4px 10px", borderRadius: 5, fontFamily: mono }}>reset</button>
        </div>

        <div ref={sbScroll} style={{ flex: 1, overflow: "auto", padding: mob ? "14px 12px" : "20px 24px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            {sbHist.length === 0 && (
              <div style={{ fontSize: 13, color: "#444", lineHeight: 1.7, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #111" }}>
                Virtual filesystem sandbox. Practice any commands from the lessons freely.
                Type <span style={{ color: "#888" }}>help</span> for available commands. <span style={{ color: "#888" }}>ls</span>, <span style={{ color: "#888" }}>cd</span>, <span style={{ color: "#888" }}>cat</span>, <span style={{ color: "#888" }}>grep</span>, <span style={{ color: "#888" }}>find</span>, <span style={{ color: "#888" }}>tree</span>, <span style={{ color: "#888" }}>head</span>, <span style={{ color: "#888" }}>tail</span> all work against a simulated project filesystem.
              </div>
            )}
            {sbHist.map((e, i) => (
              <div key={i} style={{ marginBottom: 2 }}>
                {e.prompt && <div style={{ display: "flex", gap: 8 }}><span style={{ color: "#4ade80", fontWeight: 700, whiteSpace: "pre" }}>{e.prompt} </span><span style={{ color: "#e0e0e0" }}>{e.cmd}</span></div>}
                {e.output && <pre style={{ margin: "4px 0 8px", padding: 0, background: "transparent", fontSize: 12, lineHeight: 1.5, color: "#707078", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{e.output}</pre>}
              </div>
            ))}
            <div style={{ display: "flex", gap: 0, alignItems: "center" }}>
              <span style={{ color: "#4ade80", fontWeight: 700, whiteSpace: "pre", marginRight: 8 }}>{sbPrompt} </span>
              <input ref={sbRef} type="text" value={sbInput} onChange={e => setSbInput(e.target.value)} onKeyDown={sbKd} onClick={e => e.stopPropagation()} autoCapitalize="none" autoCorrect="off" autoComplete="off" spellCheck={false}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e0e0e0", fontSize: 14, fontFamily: mono, padding: "6px 0", caretColor: "#4ade80" }} />
              <div style={{ width: 8, height: 18, background: "#4ade80", opacity: 0.7, animation: "tgBlink 1s step-end infinite", borderRadius: 1, flexShrink: 0 }} />
            </div>
          </div>
        </div>
        <style>{`@keyframes tgBlink{0%,100%{opacity:.7}50%{opacity:0}} input::placeholder{color:#1a1a1e} ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#151518;border-radius:3px} ::selection{background:#4ade8033}`}</style>
      </div>
    );
  }

  // ── LANDING ──
  if (screen === "landing") {
    return (
      <div style={{ minHeight: "100vh", background: bg, color: "#c8c8c8", fontFamily: mono, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, position: "relative" }}>
        {showInfo && <InfoModal />}
        <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", letterSpacing: "0.15em", marginBottom: 16 }}>terminally<span style={{ color: "#f0f0f0" }}>online</span><span style={{ color: "#555" }}>.sh</span></div>
            <h1 style={{ fontSize: mob ? 28 : 40, fontWeight: 800, color: "#f0f0f0", margin: "0 0 12px", lineHeight: 1.15, letterSpacing: "-1px" }}>Learn the<br/>Command Line</h1>
            <p style={{ color: "#444", fontSize: 14, margin: 0, lineHeight: 1.6 }}>Bash. Unix commands. DevOps tools.<br/>Type real commands. Build muscle memory.</p>
          </div>

          <p style={{ color: "#555", fontSize: 13, marginBottom: 16 }}>Select your machine<span style={{ color: "#333" }}> — ↑↓ navigate, Enter select, 1/2/3 jump</span>:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Object.entries(DEVICES).map(([k, d], i) => {
              const active = navIdx === i;
              return (
              <button key={k} onClick={() => { setDevice(k); setScreen("menu"); }}
                onMouseEnter={() => setNavIdx(i)}
                style={{ background: active ? "#121216" : "#0e0e10", border: `1.5px solid ${active ? "#4ade80" : "#1a1a1e"}`, borderRadius: 10, padding: "16px 20px", cursor: "pointer", textAlign: "left", transition: "all 0.15s", fontFamily: mono, display: "flex", alignItems: "center", gap: 16, color: "#ccc", outline: "none" }}>
                <span style={{ fontSize: 12, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, background: active ? "#1a2e1a" : "#131316", color: active ? "#4ade80" : "#3a3a3a", border: `1px solid ${active ? "#2d4a2d" : "#1e1e22"}`, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 22, width: 30, textAlign: "center", color: active ? "#4ade80" : "#555" }}>{d.icon}</span>
                <div><div style={{ fontSize: 15, fontWeight: 600 }}>{d.label}</div><div style={{ fontSize: 12, color: "#444", marginTop: 3 }}>{d.note}</div></div>
              </button>
              );
            })}
          </div>

          <button onClick={() => setShowInfo(true)} style={{ marginTop: 32, background: "none", border: "none", color: "#2a2a2a", fontSize: 12, cursor: "pointer", fontFamily: mono, padding: 8 }}>About this project <span style={{ color: "#1e1e1e" }}>(?)</span></button>
        </div>
      </div>
    );
  }

  // ── CHAPTER MENU ──
  if (screen === "menu") {
    const groups = [
      { label: "Fundamentals", color: "#4ade80", ids: ["nav", "read", "pipe"] },
      { label: "System & Server", color: "#f97316", ids: ["sys", "perm"] },
      { label: "Remote Work", color: "#a78bfa", ids: ["ssh", "tmux"] },
      { label: "DevOps", color: "#38bdf8", ids: ["docker", "nginx"] },
      { label: "Capstone", color: "#ef4444", ids: ["boss"] },
    ];
    return (
      <div style={{ minHeight: "100vh", background: bg, color: "#c8c8c8", fontFamily: mono, padding: 0 }}>
        {showInfo && <InfoModal />}
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", letterSpacing: "0.12em", marginBottom: 8 }}>terminally<span style={{ color: "#ddd" }}>online</span><span style={{ color: "#444" }}>.sh</span></div>
              <h2 style={{ fontSize: mob ? 22 : 28, fontWeight: 700, color: "#eee", margin: 0 }}>Choose a chapter</h2>
              <div style={{ fontSize: 11, color: "#2a2a2a", marginTop: 6 }}>↑↓ or j/k navigate · Enter select · 1-9 jump · 0 sandbox · Esc back · ? help</div>
              {doneS > 0 && <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                <div style={{ flex: 1, maxWidth: 180, height: 3, background: "#1a1a1e", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${(doneS / totalS) * 100}%`, height: "100%", background: "#4ade80", borderRadius: 2, transition: "width 0.5s" }} />
                </div>
                <span style={{ fontSize: 11, color: "#333" }}>{done.size}/{CHAPTERS.length}</span>
              </div>}
              {device && <div style={{ fontSize: 11, color: "#333", marginTop: 6 }}>{DEVICES[device].tip}</div>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setShowInfo(true)} style={{ background: "none", border: "1px solid #1a1a1e", color: "#444", fontSize: 11, cursor: "pointer", padding: "5px 10px", borderRadius: 5, fontFamily: mono }}>?</button>
              <button onClick={() => setScreen("landing")} style={{ background: "none", border: "1px solid #1a1a1e", color: "#444", fontSize: 11, cursor: "pointer", padding: "5px 10px", borderRadius: 5, fontFamily: mono }}>{DEVICES[device]?.icon}</button>
            </div>
          </div>

          {groups.map(g => (
            <div key={g.label} style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingLeft: 4 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: g.color }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#666", letterSpacing: "0.05em" }}>{g.label}</span>
              </div>
              {g.ids.map(id => {
                const ci = CHAPTERS.findIndex(c => c.id === id);
                const c = CHAPTERS[ci];
                const d = done.has(ci);
                const mi = menuItems.findIndex(m => m.type === "chapter" && m.idx === ci);
                const active = navIdx === mi;
                return (
                  <button key={id} onClick={() => startCh(ci)}
                    onMouseEnter={() => setNavIdx(mi)}
                    style={{ display: "flex", alignItems: "center", gap: 14, background: active ? "#0e0e14" : "transparent", border: active ? "1px solid #252530" : "1px solid transparent", borderRadius: 8, padding: "12px 12px", cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.12s", fontFamily: mono, color: "#ccc", outline: "none" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: active ? "#4ade80" : "#222", width: 16, textAlign: "center", flexShrink: 0 }}>{ci + 1}</span>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, background: d ? "#0f2a0f" : "#0e0e12", color: d ? "#4ade80" : active ? "#888" : "#333", border: `1.5px solid ${d ? "#1f4a1f" : active ? "#2a2a34" : "#1a1a1e"}` }}>{d ? "✓" : c.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: active ? "#eee" : "#ccc" }}>{c.title}</div>
                      <div style={{ fontSize: 12, color: "#3a3a3a", marginTop: 2 }}>{c.desc}</div>
                    </div>
                    <span style={{ fontSize: 11, color: "#222", flexShrink: 0 }}>{c.steps.length}</span>
                  </button>
                );
              })}
            </div>
          ))}

          {(() => {
            const sbActive = navIdx === menuItems.length - 1;
            return (
            <button onClick={() => setScreen("sandbox")}
              onMouseEnter={() => setNavIdx(menuItems.length - 1)}
              style={{
              marginTop: 20, width: "100%", background: sbActive ? "#121216" : "#0e0e12", border: `1.5px dashed ${sbActive ? "#4ade80" : "#1e1e24"}`, borderRadius: 10, padding: "16px 20px",
              cursor: "pointer", textAlign: "left", fontFamily: mono, display: "flex", alignItems: "center", gap: 14, color: "#ccc", transition: "all 0.15s", outline: "none",
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: sbActive ? "#4ade80" : "#222", width: 16, textAlign: "center", flexShrink: 0 }}>0</span>
              <span style={{ fontSize: 18, width: 30, textAlign: "center", color: sbActive ? "#4ade80" : "#555" }}>⟩_</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Free Practice <span style={{ fontSize: 10, fontWeight: 700, color: "#f97316", background: "#1a1008", padding: "2px 6px", borderRadius: 3, marginLeft: 8, border: "1px solid #2a1a0a" }}>BETA</span></div>
                <div style={{ fontSize: 12, color: "#3a3a3a", marginTop: 2 }}>Open sandbox with a virtual filesystem. Practice anything.</div>
              </div>
            </button>
            );
          })()}

          <div style={{ marginTop: 16, paddingTop: 20, borderTop: "1px solid #111", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <a href="https://buymeacoffee.com/tomaslawton" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#2a2a2a", textDecoration: "none", fontFamily: mono }}>☕ Support this project</a>
            <span style={{ fontSize: 11, color: "#1a1a1a" }}>Inspired by OpenVim & VimGym</span>
          </div>
        </div>
      </div>
    );
  }

  // ── LESSON ──
  const prompt = `ubuntu@server:~${ch.id === "nav" ? "/project" : ""}$`;

  return (
    <div style={{ minHeight: "100vh", background: bg, color: "#c8c8c8", fontFamily: mono, display: "flex", flexDirection: "column" }} onClick={focus}>
      {showInfo && <InfoModal />}

      {/* Top bar */}
      <div style={{ padding: mob ? "8px 12px" : "8px 20px", borderBottom: "1px solid #111", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: "#0a0a0e" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={e => { e.stopPropagation(); setScreen("menu"); setHist([]); setHint(false); setInput(""); }} style={{ background: "none", border: "1px solid #1a1a1e", color: "#444", fontSize: 11, cursor: "pointer", padding: "4px 10px", borderRadius: 5, fontFamily: mono }}>← chapters <span style={{ color: "#2a2a2a" }}>Esc</span></button>
          <span style={{ fontSize: 13, fontWeight: 700, color: ch.color }}>{ch.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#bbb" }}>{ch.title}</span>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {ch.steps.map((_, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i < stIdx ? "#4ade80" : i === stIdx && !lessonDone ? "#444" : "#151518", transition: "background 0.3s" }} />
          ))}
          <button onClick={e => { e.stopPropagation(); setShowInfo(true); }} style={{ marginLeft: 8, background: "none", border: "1px solid #1a1a1e", color: "#333", fontSize: 10, cursor: "pointer", padding: "3px 7px", borderRadius: 4, fontFamily: mono }}>?</button>
        </div>
      </div>

      {/* Terminal */}
      <div ref={scRef} style={{ flex: 1, overflow: "auto", padding: mob ? "14px 12px" : "20px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>

          {/* Teaching intro */}
          {hist.length === 0 && (
            <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #111" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: ch.color, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>{ch.title}</div>
              {ch.teach.map((p, i) => <p key={i} style={{ fontSize: 13, color: "#555", lineHeight: 1.75, margin: i === 0 ? 0 : "8px 0 0" }}>{p}</p>)}
            </div>
          )}

          {/* History */}
          {hist.map((e, i) => (
            <div key={i} style={{ marginBottom: e.t === "note" || e.t === "done" || e.t === "help" ? 20 : 3 }}>
              {e.t === "in" && <div style={{ display: "flex", gap: 8 }}><span style={{ color: "#4ade80", fontWeight: 700, whiteSpace: "pre" }}>{prompt} </span><span style={{ color: "#e0e0e0" }}>{e.v}</span></div>}
              {e.t === "out" && <pre style={{ margin: "5px 0", padding: "10px 14px", background: "#0c0c10", borderRadius: 6, fontSize: 12, lineHeight: 1.6, color: "#707078", whiteSpace: "pre-wrap", wordBreak: "break-word", border: "1px solid #131318" }}>{e.v}</pre>}
              {e.t === "note" && <div style={{ fontSize: 13, color: "#7a7a56", padding: "8px 0 8px 14px", borderLeft: "2px solid #28281a", marginTop: 4, lineHeight: 1.6 }}>{e.v}</div>}
              {e.t === "err" && <div style={{ fontSize: 12, color: "#804040", padding: "2px 0" }}>{e.v}</div>}
              {e.t === "done" && <div style={{ fontSize: 14, color: "#4ade80", padding: "14px 0", fontWeight: 700 }}>✓ {e.v} — complete</div>}
              {e.t === "help" && (
                <div style={{ fontSize: 12, color: "#555", padding: "10px 14px", background: "#0c0c10", borderRadius: 6, lineHeight: 1.7, border: "1px solid #131318" }}>
                  <span style={{ color: "#888", fontWeight: 700 }}>terminallyonline.sh help</span><br/><br/>
                  <span style={{ color: "#666" }}>Tab</span> — show hint for current step<br/>
                  <span style={{ color: "#666" }}>↑ / ↓</span> — cycle through command history<br/>
                  <span style={{ color: "#666" }}>clear</span> — reset the terminal output<br/>
                  <span style={{ color: "#666" }}>help</span> — show this message<br/><br/>
                  Each step teaches one concept. Read the green box first, then type the command. The goal is to build muscle memory — come back and try without hints.
                </div>
              )}
            </div>
          ))}

          {/* Current step */}
          {!lessonDone && st && (
            <div style={{ marginTop: hist.length > 0 ? 16 : 0 }}>
              <div style={{ fontSize: 13, color: "#4a6a4a", padding: "10px 14px", background: "#0a100a", borderRadius: 6, marginBottom: 12, lineHeight: 1.65, border: "1px solid #121a12" }}>{st.learn}</div>
              <div style={{ fontSize: 13, color: "#aaa", marginBottom: 12, lineHeight: 1.6 }}>
                <span style={{ display: "inline-block", background: "#10101e", color: ch.color, fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 4, marginRight: 10, verticalAlign: "middle", letterSpacing: "0.04em" }}>STEP {stIdx + 1}/{ch.steps.length}</span>
                {st.task}
              </div>
              {hint && <div style={{ fontSize: 12, color: "#444", marginBottom: 8, padding: "6px 12px", background: "#0c0c10", borderRadius: 5, display: "inline-block", border: "1px solid #151518" }}>→ <span style={{ color: "#888" }}>{st.hint}</span></div>}
              <div style={{ display: "flex", gap: 0, alignItems: "center", animation: shake ? "tgShake 0.4s ease" : "none" }}>
                <span style={{ color: "#4ade80", fontWeight: 700, whiteSpace: "pre", marginRight: 8 }}>{prompt} </span>
                <input ref={inRef} type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={kd} onClick={e => e.stopPropagation()} placeholder="" autoCapitalize="none" autoCorrect="off" autoComplete="off" spellCheck={false}
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e0e0e0", fontSize: 14, fontFamily: mono, padding: "6px 0", caretColor: "#4ade80" }} />
                <div style={{ width: 8, height: 18, background: "#4ade80", opacity: 0.7, animation: "tgBlink 1s step-end infinite", borderRadius: 1, flexShrink: 0 }} />
              </div>
              <div style={{ fontSize: 11, color: "#1a1a1e", marginTop: 8 }}>enter · tab hint · ↑↓ history · help · clear · esc back</div>
            </div>
          )}

          {/* Complete */}
          {lessonDone && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {chIdx < CHAPTERS.length - 1 && (
                  <button onClick={e => { e.stopPropagation(); startCh(chIdx + 1); }} style={{ background: "#0f1f0f", border: "1.5px solid #1f3a1f", color: "#4ade80", fontSize: 13, cursor: "pointer", padding: "10px 20px", borderRadius: 6, fontFamily: mono, fontWeight: 700 }}>
                    Next: {CHAPTERS[chIdx + 1].title} →
                  </button>
                )}
                <button onClick={e => { e.stopPropagation(); startCh(chIdx); }} style={{ background: "none", border: "1.5px solid #1a1a1e", color: "#444", fontSize: 13, cursor: "pointer", padding: "10px 20px", borderRadius: 6, fontFamily: mono }}>Practice again</button>
                <button onClick={e => { e.stopPropagation(); setScreen("menu"); setHist([]); }} style={{ background: "none", border: "1.5px solid #1a1a1e", color: "#444", fontSize: 13, cursor: "pointer", padding: "10px 20px", borderRadius: 6, fontFamily: mono }}>All chapters</button>
              </div>
              {done.size === CHAPTERS.length && (
                <div style={{ marginTop: 20, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                  All chapters complete. Now go use these on a real server. Break things and fix them — that's where the real learning happens.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes tgShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}50%{transform:translateX(3px)}75%{transform:translateX(-3px)}}
        @keyframes tgBlink{0%,100%{opacity:.7}50%{opacity:0}}
        input::placeholder{color:#1a1a1e}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#151518;border-radius:3px}
        ::selection{background:#4ade8033}
      `}</style>
    </div>
  );
}

export function resolvePath(p, cwd) {
  if (p.startsWith("/")) return p;
  if (p.startsWith("~/")) return "/home/ubuntu" + p.slice(1);
  const parts = (cwd + "/" + p).split("/").filter(Boolean);
  const resolved = [];
  for (const part of parts) {
    if (part === "..") resolved.pop();
    else if (part !== ".") resolved.push(part);
  }
  return "/" + resolved.join("/");
}

export function executeCommand(raw, cwd, fs, cmdHistory) {
  const trimmed = raw.trim();
  if (!trimmed) return { output: "", newCwd: cwd };
  const parts = trimmed.split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);

  if (cmd === "clear") return { output: null, newCwd: cwd };
  if (cmd === "help") return { output: "Available commands: ls, cd, pwd, cat, head, tail, grep, wc, find, tree, echo, whoami, env, which, history, clear\n\nThis is a virtual filesystem sandbox. Practice any commands from the lessons freely.\nNot all flags are supported — this is for building muscle memory with core commands.", newCwd: cwd };
  if (cmd === "pwd") return { output: cwd, newCwd: cwd };
  if (cmd === "whoami") return { output: "ubuntu", newCwd: cwd };
  if (cmd === "echo") return { output: args.join(" ").replace(/["']/g, "").replace(/\$HOME/g, "/home/ubuntu").replace(/\$USER/g, "ubuntu"), newCwd: cwd };
  if (cmd === "which") {
    const bins = { python: "/usr/bin/python3", node: "/usr/bin/node", docker: "/usr/bin/docker", nginx: "/usr/sbin/nginx", vim: "/usr/bin/vim", git: "/usr/bin/git", ssh: "/usr/bin/ssh", curl: "/usr/bin/curl", grep: "/usr/bin/grep" };
    return { output: bins[args[0]] || `${args[0]} not found`, newCwd: cwd };
  }
  if (cmd === "env") {
    const envs = "HOME=/home/ubuntu\nUSER=ubuntu\nPATH=/usr/local/bin:/usr/bin:/bin\nSHELL=/bin/bash\nCUDA_HOME=/usr/local/cuda-12.2\nCUDA_VISIBLE_DEVICES=0,1\nLD_LIBRARY_PATH=/usr/local/cuda-12.2/lib64\nPYTHONPATH=/home/ubuntu/project";
    if (args.length && args[0] === "|" && args[1] === "grep") {
      const filtered = envs.split("\n").filter(l => l.toLowerCase().includes(args.slice(2).join(" ").toLowerCase())).join("\n");
      return { output: filtered || "(no matches)", newCwd: cwd };
    }
    return { output: envs, newCwd: cwd };
  }
  if (cmd === "history") return { output: cmdHistory.map((c, i) => `  ${i + 1}  ${c}`).join("\n") || "(empty)", newCwd: cwd };

  if (cmd === "cd") {
    const target = args[0] || "/home/ubuntu";
    if (target === "-") return { output: "", newCwd: cwd };
    const p = resolvePath(target, cwd);
    const node = fs[p];
    if (!node || node.type !== "dir") return { output: `cd: ${target}: No such directory`, newCwd: cwd };
    return { output: "", newCwd: p };
  }

  if (cmd === "ls") {
    const showAll = args.includes("-a") || args.includes("-la") || args.includes("-al") || args.includes("-lah");
    const showLong = args.includes("-l") || args.includes("-la") || args.includes("-al") || args.includes("-lah");
    const pathArg = args.find(a => !a.startsWith("-"));
    const target = pathArg ? resolvePath(pathArg, cwd) : cwd;
    const node = fs[target];
    if (!node || node.type !== "dir") return { output: `ls: cannot access '${pathArg || "."}': No such file or directory`, newCwd: cwd };
    let items = [...node.children];
    if (showAll) items = [".", "..", ...items];
    if (showLong) {
      return {
        output: items.map(name => {
          if (name === "." || name === "..") return `drwxr-xr-x  ubuntu ubuntu 4096 Mar 18 22:15 ${name}`;
          const childPath = target + "/" + name;
          const child = fs[childPath];
          if (child?.type === "dir") return `drwxr-xr-x  ubuntu ubuntu 4096 Mar 17 16:45 ${name}`;
          return `-rw-r--r--  ubuntu ubuntu ${(child?.content?.length || 120).toString().padStart(4)} Mar 15 11:20 ${name}`;
        }).join("\n"),
        newCwd: cwd,
      };
    }
    return { output: items.join("  "), newCwd: cwd };
  }

  if (cmd === "cat") {
    if (!args[0]) return { output: "cat: missing operand", newCwd: cwd };
    const p = resolvePath(args[0], cwd);
    const node = fs[p];
    if (!node) return { output: `cat: ${args[0]}: No such file or directory`, newCwd: cwd };
    if (node.type === "dir") return { output: `cat: ${args[0]}: Is a directory`, newCwd: cwd };
    return { output: node.content, newCwd: cwd };
  }

  if (cmd === "head") {
    let n = 10; let file = args[0];
    if (args[0] === "-n" && args[1]) { n = parseInt(args[1]); file = args[2]; }
    else if (args[0]?.startsWith("-")) { n = parseInt(args[0].slice(1)); file = args[1]; }
    if (!file) return { output: "head: missing operand", newCwd: cwd };
    const p = resolvePath(file, cwd);
    const node = fs[p];
    if (!node || node.type === "dir") return { output: `head: ${file}: No such file or directory`, newCwd: cwd };
    return { output: node.content.split("\n").slice(0, n).join("\n"), newCwd: cwd };
  }

  if (cmd === "tail") {
    let n = 10; let file = args[0];
    if (args[0] === "-f") {
      file = args[1];
      if (!file) return { output: "tail: missing operand", newCwd: cwd };
      const p = resolvePath(file, cwd);
      const node = fs[p];
      if (!node) return { output: `tail: ${file}: No such file`, newCwd: cwd };
      return { output: node.content.split("\n").slice(-n).join("\n") + "\n█ watching... (Ctrl+C to stop)", newCwd: cwd };
    }
    if (args[0] === "-n" && args[1]) { n = parseInt(args[1]); file = args[2]; }
    else if (args[0]?.startsWith("-")) { n = parseInt(args[0].slice(1)); file = args[1]; }
    if (!file) return { output: "tail: missing operand", newCwd: cwd };
    const p = resolvePath(file, cwd);
    const node = fs[p];
    if (!node || node.type === "dir") return { output: `tail: ${file}: No such file`, newCwd: cwd };
    return { output: node.content.split("\n").slice(-n).join("\n"), newCwd: cwd };
  }

  if (cmd === "grep") {
    const flags = args.filter(a => a.startsWith("-"));
    const nonFlags = args.filter(a => !a.startsWith("-"));
    const pattern = nonFlags[0]; const file = nonFlags[1];
    if (!pattern) return { output: "grep: missing pattern", newCwd: cwd };
    if (!file) return { output: "grep: missing file operand", newCwd: cwd };
    const caseI = flags.includes("-i");
    const countOnly = flags.includes("-c");
    const p = resolvePath(file, cwd);
    const node = fs[p];
    if (!node || node.type === "dir") return { output: `grep: ${file}: No such file`, newCwd: cwd };
    const lines = node.content.split("\n").filter(l => caseI ? l.toLowerCase().includes(pattern.toLowerCase()) : l.includes(pattern));
    if (countOnly) return { output: String(lines.length), newCwd: cwd };
    return { output: lines.join("\n") || "(no matches)", newCwd: cwd };
  }

  if (cmd === "wc") {
    if (args[0] === "-l" && args[1]) {
      const p = resolvePath(args[1], cwd);
      const node = fs[p];
      if (!node || node.type === "dir") return { output: `wc: ${args[1]}: No such file`, newCwd: cwd };
      return { output: `  ${node.content.split("\n").length} ${args[1]}`, newCwd: cwd };
    }
    if (args[0] === "-w") return { output: "2", newCwd: cwd };
    return { output: "Usage: wc -l <file>", newCwd: cwd };
  }

  if (cmd === "find") {
    const root = args[0] || ".";
    const nameIdx = args.indexOf("-name");
    const pattern = nameIdx >= 0 ? args[nameIdx + 1]?.replace(/["']/g, "") : null;
    const rootPath = resolvePath(root, cwd);
    const results = [];
    for (const [path] of Object.entries(fs)) {
      if (!path.startsWith(rootPath)) continue;
      const name = path.split("/").pop();
      if (pattern) {
        const regex = new RegExp("^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
        if (regex.test(name)) results.push(path.replace(rootPath, root === "." ? "." : root));
      } else {
        results.push(path.replace(rootPath, root === "." ? "." : root));
      }
    }
    return { output: results.join("\n") || "(no matches)", newCwd: cwd };
  }

  if (cmd === "tree") {
    let depth = 2;
    if (args[0] === "-L" && args[1]) depth = parseInt(args[1]);
    const target = args.find(a => !a.startsWith("-") && a !== args[args.indexOf("-L") + 1]) || ".";
    const rootPath = resolvePath(target, cwd);
    const node = fs[rootPath];
    if (!node || node.type !== "dir") return { output: `tree: ${target}: No such directory`, newCwd: cwd };
    const lines = [target];
    const buildTree = (path, prefix, d) => {
      const n = fs[path];
      if (!n || n.type !== "dir" || d >= depth) return;
      n.children.forEach((child, i) => {
        const isLast = i === n.children.length - 1;
        lines.push(prefix + (isLast ? "└── " : "├── ") + child);
        if (d + 1 < depth) buildTree(path + "/" + child, prefix + (isLast ? "    " : "│   "), d + 1);
      });
    };
    buildTree(rootPath, "", 0);
    return { output: lines.join("\n"), newCwd: cwd };
  }

  if (cmd === "mkdir" || cmd === "touch" || cmd === "cp" || cmd === "mv" || cmd === "rm" || cmd === "chmod" || cmd === "chown") return { output: `(simulated) ${trimmed} — OK`, newCwd: cwd };
  if (cmd === "docker") return { output: "CONTAINER ID  IMAGE        STATUS     PORTS                  NAMES\na1b2c3d4e5f6  mymodel:v2   Up 2 days  0.0.0.0:8000->8000/tcp inference_api\nb2c3d4e5f6a1  redis:7      Up 2 days  6379/tcp               redis", newCwd: cwd };
  if (cmd === "nvidia-smi") return { output: "| GPU  Name       Mem-Usage       GPU-Util |\n|  0   A100 80GB  12040/81920 MiB    67%   |\n|  1   A100 80GB      0/81920 MiB     0%   |", newCwd: cwd };
  if (cmd === "free") return { output: "              total    used    free   available\nMem:           61Gi   22.1Gi   30Gi      37Gi\nSwap:            0B      0B      0B", newCwd: cwd };
  if (cmd === "df") return { output: "Filesystem      Size  Used Avail Use% Mounted on\n/dev/nvme0n1p1  200G   42G  158G  21% /\n/dev/nvme1n1    500G  312G  188G  63% /data", newCwd: cwd };
  if (cmd === "uptime") return { output: " 10:42:13 up 14 days, 3:22, 2 users, load average: 0.42, 0.38, 0.35", newCwd: cwd };
  if (cmd === "uname") return { output: "Linux gpu-box 5.15.0-91-generic #101-Ubuntu SMP x86_64 GNU/Linux", newCwd: cwd };
  if (cmd === "htop" || cmd === "top") return { output: "CPU[||||||||||||       34.2%]  Mem[||||||||||||||  14.2G/61G]\n\n  PID  USER    CPU%  MEM%  COMMAND\n12345  ubuntu  45.2   8.3  python train.py\n12478  ubuntu   0.3   1.2  python inference.py\n\n  q to quit", newCwd: cwd };
  if (cmd === "ps") return { output: "ubuntu  12345 45.2 8.3 python train.py --epochs 50\nubuntu  12478  0.3 1.2 python inference.py --port 8000", newCwd: cwd };
  if (cmd === "ssh" || cmd === "scp" || cmd === "rsync" || cmd === "tmux" || cmd === "curl" || cmd === "ping" || cmd === "wget") return { output: `(simulated) ${trimmed} — OK`, newCwd: cwd };

  return { output: `${cmd}: command not found\nAvailable: ls, cd, cat, head, tail, grep, wc, find, tree, echo, pwd, whoami, env, which, history, clear`, newCwd: cwd };
}

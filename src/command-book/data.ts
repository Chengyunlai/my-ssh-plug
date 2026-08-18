export interface CommandEntry {
  cmd: string
  desc: string
  example?: string
}

export interface CommandCategory {
  name: string
  commands: CommandEntry[]
}

export const categories: CommandCategory[] = [
  {
    name: '文件与目录',
    commands: [
      { cmd: 'ls', desc: '列出目录内容', example: 'ls -lah' },
      { cmd: 'cd', desc: '切换当前目录', example: 'cd /var/log' },
      { cmd: 'pwd', desc: '显示当前工作目录' },
      { cmd: 'mkdir', desc: '创建目录,可递归创建', example: 'mkdir -p app/src' },
      { cmd: 'rm', desc: '删除文件或目录', example: 'rm -rf build/' },
      { cmd: 'cp', desc: '复制文件或目录', example: 'cp -r conf.d /etc/nginx/' },
      { cmd: 'mv', desc: '移动或重命名', example: 'mv app.log app.log.bak' },
      { cmd: 'touch', desc: '创建空文件或更新时间戳', example: 'touch index.js' },
      { cmd: 'ln', desc: '创建硬链接或软链接', example: 'ln -s /opt/node/bin/node /usr/local/bin/node' },
      { cmd: 'find', desc: '按条件查找文件', example: 'find /var/log -name "*.log" -mtime -7' }
    ]
  },
  {
    name: '文本处理',
    commands: [
      { cmd: 'cat', desc: '输出文件内容', example: 'cat /etc/hosts' },
      { cmd: 'head', desc: '查看文件开头', example: 'head -n 20 access.log' },
      { cmd: 'tail', desc: '查看文件结尾,可实时跟踪', example: 'tail -f app.log' },
      { cmd: 'grep', desc: '按正则过滤文本', example: 'grep -rn "ERROR" logs/' },
      { cmd: 'sed', desc: '流式编辑与替换', example: 'sed -i "s/8080/9090/g" nginx.conf' },
      { cmd: 'awk', desc: '按列处理文本', example: "awk '{print $1, $3}' access.log" },
      { cmd: 'sort', desc: '排序文本行', example: 'sort -n -r scores.txt' },
      { cmd: 'uniq', desc: '去重或统计重复行', example: 'sort f.txt | uniq -c' },
      { cmd: 'wc', desc: '统计行数 / 词数 / 字节', example: 'wc -l app.log' },
      { cmd: 'diff', desc: '比较文件差异', example: 'diff -u old.txt new.txt' }
    ]
  },
  {
    name: '系统信息',
    commands: [
      { cmd: 'uname', desc: '查看内核与系统信息', example: 'uname -a' },
      { cmd: 'hostname', desc: '查看或设置主机名' },
      { cmd: 'uptime', desc: '系统运行时间与负载' },
      { cmd: 'whoami', desc: '显示当前登录用户' },
      { cmd: 'id', desc: '查看用户 UID / GID', example: 'id ubuntu' },
      { cmd: 'date', desc: '显示或设置日期时间', example: 'date "+%Y-%m-%d %H:%M"' },
      { cmd: 'free', desc: '查看内存使用情况', example: 'free -h' },
      { cmd: 'df', desc: '查看磁盘分区使用率', example: 'df -h' },
      { cmd: 'du', desc: '统计目录占用空间', example: 'du -sh *' },
      { cmd: 'lscpu', desc: '查看 CPU 信息' }
    ]
  },
  {
    name: '进程管理',
    commands: [
      { cmd: 'ps', desc: '查看进程快照', example: 'ps aux | grep nginx' },
      { cmd: 'top', desc: '实时查看进程与资源占用' },
      { cmd: 'htop', desc: '交互式进程管理(需安装)' },
      { cmd: 'kill', desc: '按 PID 结束进程', example: 'kill -9 1234' },
      { cmd: 'pkill', desc: '按名称结束进程', example: 'pkill -f "node app.js"' },
      { cmd: 'pgrep', desc: '按名称查找 PID', example: 'pgrep -u www-data' },
      { cmd: 'nohup', desc: '忽略挂断信号后台运行', example: 'nohup node app.js > app.log 2>&1 &' },
      { cmd: 'jobs', desc: '查看当前后台作业', example: 'jobs -l' },
      { cmd: 'nice', desc: '以指定优先级运行', example: 'nice -n -5 make' },
      { cmd: 'watch', desc: '周期执行并刷新输出', example: 'watch -n 2 free -h' }
    ]
  },
  {
    name: '网络',
    commands: [
      { cmd: 'ping', desc: '测试网络连通性', example: 'ping -c 4 example.com' },
      { cmd: 'curl', desc: '发起 HTTP 请求', example: 'curl -I https://example.com' },
      { cmd: 'wget', desc: '下载文件', example: 'wget -c https://example.com/x.tar.gz' },
      { cmd: 'ssh', desc: '远程登录', example: 'ssh user@host -p 22' },
      { cmd: 'scp', desc: '远程复制文件', example: 'scp app.tar.gz user@host:/tmp/' },
      { cmd: 'rsync', desc: '增量同步文件', example: 'rsync -avz ./src user@host:/srv/' },
      { cmd: 'netstat', desc: '查看端口与连接', example: 'netstat -tlnp' },
      { cmd: 'ss', desc: '快速查看套接字', example: 'ss -tlnp' },
      { cmd: 'ip', desc: '查看或配置网络', example: 'ip addr show' },
      { cmd: 'nslookup', desc: 'DNS 查询', example: 'nslookup example.com' }
    ]
  },
  {
    name: '权限与用户',
    commands: [
      { cmd: 'chmod', desc: '修改文件权限', example: 'chmod 755 deploy.sh' },
      { cmd: 'chown', desc: '修改属主 / 属组', example: 'chown -R www-data:www-data /var/www' },
      { cmd: 'umask', desc: '设置默认权限掩码', example: 'umask 022' },
      { cmd: 'sudo', desc: '以其他用户身份执行', example: 'sudo apt update' },
      { cmd: 'su', desc: '切换用户', example: 'su - root' },
      { cmd: 'passwd', desc: '修改用户密码', example: 'passwd ubuntu' },
      { cmd: 'useradd', desc: '新建用户', example: 'useradd -m -s /bin/bash tom' },
      { cmd: 'usermod', desc: '修改用户属性', example: 'usermod -aG sudo tom' },
      { cmd: 'userdel', desc: '删除用户', example: 'userdel -r tom' },
      { cmd: 'groupadd', desc: '新建用户组', example: 'groupadd devops' }
    ]
  },
  {
    name: '压缩打包',
    commands: [
      { cmd: 'tar', desc: '打包 / 解包', example: 'tar -czvf app.tar.gz ./app' },
      { cmd: 'gzip', desc: '压缩为 .gz', example: 'gzip access.log' },
      { cmd: 'gunzip', desc: '解压 .gz 文件', example: 'gunzip access.log.gz' },
      { cmd: 'zip', desc: '打包为 .zip', example: 'zip -r app.zip ./app' },
      { cmd: 'unzip', desc: '解压 .zip 文件', example: 'unzip app.zip' },
      { cmd: 'bzip2', desc: '压缩为 .bz2', example: 'bzip2 big.log' },
      { cmd: 'xz', desc: '高压缩率压缩', example: 'xz -k big.log' },
      { cmd: 'zcat', desc: '不解压查看 .gz 内容', example: 'zcat access.log.gz | head' },
      { cmd: '7z', desc: '7-Zip 压缩(需安装)', example: '7z a app.7z ./app' },
      { cmd: 'zstd', desc: 'Zstandard 压缩(需安装)', example: 'zstd -v big.log' }
    ]
  },
  {
    name: '磁盘管理',
    commands: [
      { cmd: 'mount', desc: '挂载设备', example: 'mount /dev/sdb1 /mnt/data' },
      { cmd: 'umount', desc: '卸载设备', example: 'umount /mnt/data' },
      { cmd: 'fdisk', desc: '磁盘分区', example: 'fdisk -l' },
      { cmd: 'lsblk', desc: '查看块设备树', example: 'lsblk -f' },
      { cmd: 'blkid', desc: '查看分区 UUID / 类型', example: 'blkid' },
      { cmd: 'fsck', desc: '检查修复文件系统', example: 'fsck -f /dev/sdb1' },
      { cmd: 'mkfs', desc: '格式化分区', example: 'mkfs.ext4 /dev/sdb1' },
      { cmd: 'parted', desc: '高级分区工具', example: 'parted -l' },
      { cmd: 'dd', desc: '块级复制 / 备份', example: 'dd if=/dev/sda of=/tmp/disk.img bs=4M' },
      { cmd: 'swapon', desc: '启用交换分区', example: 'swapon -a' }
    ]
  },
  {
    name: '软件包管理',
    commands: [
      { cmd: 'apt', desc: 'Debian 系包管理', example: 'apt update && apt upgrade -y' },
      { cmd: 'apt-get', desc: '传统包管理命令', example: 'apt-get install -y nginx' },
      { cmd: 'dpkg', desc: '管理 .deb 包', example: 'dpkg -i app.deb' },
      { cmd: 'yum', desc: 'CentOS 系包管理', example: 'yum install -y htop' },
      { cmd: 'dnf', desc: '新一代 yum', example: 'dnf search nginx' },
      { cmd: 'rpm', desc: '管理 .rpm 包', example: 'rpm -qa | grep nginx' },
      { cmd: 'snap', desc: '管理 snap 包', example: 'snap install chromium' },
      { cmd: 'make', desc: '源码编译安装', example: './configure && make && make install' },
      { cmd: 'pip', desc: 'Python 包管理', example: 'pip install requests' },
      { cmd: 'npm', desc: 'Node 包管理', example: 'npm install -g pm2' }
    ]
  },
  {
    name: '服务与日志',
    commands: [
      { cmd: 'systemctl', desc: 'systemd 服务管理', example: 'systemctl restart nginx' },
      { cmd: 'journalctl', desc: '查看 systemd 日志', example: 'journalctl -u nginx -f' },
      { cmd: 'service', desc: '传统服务管理', example: 'service nginx status' },
      { cmd: 'crontab', desc: '管理定时任务', example: 'crontab -e' },
      { cmd: 'dmesg', desc: '查看内核环形日志', example: 'dmesg | tail -n 20' },
      { cmd: 'sysctl', desc: '查看或修改内核参数', example: 'sysctl -a | grep tcp' },
      { cmd: 'logrotate', desc: '日志轮转', example: 'logrotate -f /etc/logrotate.conf' },
      { cmd: 'at', desc: '一次性定时任务', example: 'echo "backup.sh" | at 02:00' },
      { cmd: 'last', desc: '查看最近登录记录', example: 'last -n 10' },
      { cmd: 'who', desc: '查看当前登录用户', example: 'who' }
    ]
  }
]

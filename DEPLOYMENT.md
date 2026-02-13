# 部署指南（持久化架构）

本应用使用 **FastAPI + 本地 pyseekdb**，适合部署到带持久化磁盘的平台：Railway、Render、Fly.io 或 VPS。

## 环境变量

| 变量 | 说明 | 默认 |
|------|------|------|
| `PORT` | 服务端口（云平台会自动注入） | `8000` |
| `DATA_DIR` | 数据库存储目录（**必须可持久化**） | `.`（当前目录） |

---

## 1. Railway

1. 登录 [railway.app](https://railway.app)，New Project → **Deploy from GitHub**，选择本仓库。
2. 在项目里为服务添加 **Volume**：
   - 点击服务 → **Variables** 旁 **+ New** → **Add Volume**
   - Mount Path 填：`/data`
3. 在 **Variables** 中添加：
   - `DATA_DIR` = `/data`
4. Railway 会自动检测 Python 并执行 `pip install -r requirements.txt`。若需指定启动命令，在 **Settings** → **Deploy** 中设置：
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. 部署完成后使用生成的 URL 访问。

---

## 2. Render

1. 登录 [render.com](https://render.com)，**New** → **Web Service**，连接 GitHub 并选择本仓库。
2. 配置：
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. 添加 **Disk**（持久化）：
   - 在 Web Service 页面 → **Disks** → **Add Disk**
   - Mount Path：`/data`
   - 在 **Environment** 中添加：`DATA_DIR` = `/data`
4. 保存并部署。

---

## 3. Fly.io

1. 安装 [flyctl](https://fly.io/docs/hacks/install-flyctl/) 并登录：`fly auth login`。
2. 在项目根目录执行：
   ```bash
   fly launch --no-deploy
   ```
   按提示选 region、App 名称等。
3. 添加持久化 Volume：
   ```bash
   fly volumes create seekdb_data --size 1 --region <你的region>
   ```
4. 编辑 `fly.toml`，在 `[http_service]` 或现有配置下增加 `[mounts]`（或把 `mount` 写在 `[vm]` 里，视 fly 版本而定）：
   ```toml
   [mounts]
     source = "seekdb_data"
     destination = "/data"
   ```
5. 设置环境变量：
   ```bash
   fly secrets set DATA_DIR=/data
   ```
6. 若 Fly 未自动识别 Python，在项目根目录添加 `Dockerfile`（见下方 **可选：Dockerfile**），然后：
   ```bash
   fly deploy
   ```

---

## 4. VPS（Ubuntu / Debian）

在任意一台有公网 IP 的 Linux 服务器上：

```bash
# 安装 Python 3.11+ 和 venv
sudo apt update && sudo apt install -y python3 python3-venv python3-pip

# 克隆仓库（或上传代码）
git clone <你的仓库URL> smart-notes && cd smart-notes

# 虚拟环境与依赖
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# 使用持久化目录（可选，便于备份）
export DATA_DIR=/var/lib/smart-notes
sudo mkdir -p $DATA_DIR && sudo chown "$USER:$USER" $DATA_DIR

# 前台运行（调试）
uvicorn main:app --host 0.0.0.0 --port 8000
```

**生产环境**建议用 systemd 或 supervisor 管理进程，并用 Nginx/Caddy 做反向代理与 HTTPS。

---

## 可选：Dockerfile（用于 Fly.io 或自建 Docker）

若平台需要自定义镜像，可在项目根目录使用：

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

ENV DATA_DIR=/data
VOLUME /data

EXPOSE 8000
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
```

运行示例（本地或 VPS）：

```bash
docker build -t smart-notes .
docker run -p 8000:8000 -v $(pwd)/data:/data -e DATA_DIR=/data smart-notes
```

---

## 备份

数据库位于 `DATA_DIR` 下的 `seekdb.db` 目录。定期备份该目录即可保留全部笔记数据。

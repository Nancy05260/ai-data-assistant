"""
业务数据库填充 - 电商示例数据。
用法：在 backend 目录下执行 python data/seed_data.py
"""
import os
import random
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

# 确保从 backend 运行，biz_db 路径与 config 一致
BACKEND_DIR = Path(__file__).resolve().parent.parent
os.chdir(BACKEND_DIR)
BIZ_DB = BACKEND_DIR / "data" / "business.db"
BIZ_DB.parent.mkdir(parents=True, exist_ok=True)

PRODUCT_NAMES = [
    "苹果", "香蕉", "牛奶", "面包", "鸡蛋", "酸奶", "橙子", "葡萄", "鸡肉", "牛肉",
    "大米", "面条", "酱油", "食用油", "纸巾", "洗发水", "牙膏", "洗衣液", "手机壳", "充电器",
    "笔记本", "鼠标", "键盘", "耳机", "U盘", "台灯", "保温杯", "背包", "雨伞", "口罩",
]
CATEGORIES = ["水果", "饮品", "食品", "日用品", "数码配件", "办公", "出行"]
CITIES = ["北京", "上海", "广州", "深圳", "杭州", "成都", "武汉", "西安", "南京", "苏州"]
STATUSES = ["pending", "paid", "shipped", "completed", "cancelled"]


def main():
    conn = sqlite3.connect(BIZ_DB)
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            stock INTEGER NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            gender TEXT NOT NULL,
            age INTEGER NOT NULL,
            city TEXT NOT NULL,
            registration_date TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL REFERENCES customers(id),
            order_date TEXT NOT NULL,
            total_amount REAL NOT NULL,
            status TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL REFERENCES orders(id),
            product_id INTEGER NOT NULL REFERENCES products(id),
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL
        );
        DELETE FROM order_items;
        DELETE FROM orders;
        DELETE FROM customers;
        DELETE FROM products;
    """)
    conn.commit()

    now = datetime.utcnow().isoformat() + "Z"
    # 约 50 商品
    for i, name in enumerate(PRODUCT_NAMES, 1):
        conn.execute(
            "INSERT INTO products (id, name, category, price, stock, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (i, name, random.choice(CATEGORIES), round(random.uniform(5, 200), 2), random.randint(10, 500), now),
        )
    # 约 100 客户
    for i in range(1, 101):
        conn.execute(
            "INSERT INTO customers (id, name, gender, age, city, registration_date) VALUES (?, ?, ?, ?, ?, ?)",
            (i, f"用户{i}", random.choice(["M", "F"]), random.randint(18, 60), random.choice(CITIES),
             (datetime.utcnow() - timedelta(days=random.randint(0, 365))).strftime("%Y-%m-%d")),
        )
    conn.commit()

    # 约 250 订单，每单 1~4 个 order_items
    oid = 1
    for _ in range(250):
        cid = random.randint(1, 100)
        order_date = (datetime.utcnow() - timedelta(days=random.randint(0, 180))).strftime("%Y-%m-%d")
        total = 0.0
        items = []
        for _ in range(random.randint(1, 4)):
            pid = random.randint(1, len(PRODUCT_NAMES))
            qty = random.randint(1, 5)
            price = round(random.uniform(5, 200), 2)
            total += qty * price
            items.append((oid, pid, qty, price))
        conn.execute(
            "INSERT INTO orders (id, customer_id, order_date, total_amount, status) VALUES (?, ?, ?, ?, ?)",
            (oid, cid, order_date, round(total, 2), random.choice(STATUSES)),
        )
        for _, pid, qty, up in items:
            conn.execute("INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
                        (oid, pid, qty, up))
        oid += 1
    conn.commit()

    count = conn.execute("SELECT COUNT(*) FROM order_items").fetchone()[0]
    conn.close()
    print(f"[OK] business.db 已初始化: products={len(PRODUCT_NAMES)}, customers=100, orders=250, order_items={count}")


if __name__ == "__main__":
    main()

import socket
import threading
import random
import string

HOST = "0.0.0.0"
PORT = 5555

# rooms[code] = [socket_host, socket_joiner_or_None]
rooms = {}
rooms_lock = threading.Lock()


def generate_code():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


def forward(src, dst, label):
    """Read from src, write to dst. Closes both when done."""
    try:
        while True:
            data = src.recv(4096)
            if not data:
                break
            dst.sendall(data)
    except Exception:
        pass
    finally:
        print(f"[relay] {label} disconnected")
        try: src.close()
        except: pass
        try: dst.close()
        except: pass


def handle_client(conn, addr):
    print(f"[relay] connection from {addr}")
    try:
        # First message must be "HOST" or "JOIN <code>"
        raw = conn.recv(64).decode().strip()
    except Exception:
        conn.close()
        return

    if raw == "HOST":
        with rooms_lock:
            code = generate_code()
            while code in rooms:
                code = generate_code()
            rooms[code] = [conn, None]

        # Send the code back to the host
        try:
            conn.sendall(f"CODE {code}\n".encode())
        except Exception:
            with rooms_lock:
                rooms.pop(code, None)
            conn.close()
            return

        print(f"[relay] room created: {code}")

        # Wait for a joiner to arrive (poll the slot)
        import time
        for _ in range(300):  # 5 min timeout (300 * 1s)
            time.sleep(1)
            with rooms_lock:
                pair = rooms.get(code)
            if pair and pair[1] is not None:
                joiner = pair[1]
                print(f"[relay] room {code} is full — bridging")
                # Tell host the game can start
                try:
                    conn.sendall(b"READY\n")
                except Exception:
                    pass
                # Bridge the two sockets
                t = threading.Thread(target=forward, args=(conn, joiner, f"{code} host->join"), daemon=True)
                t.start()
                forward(joiner, conn, f"{code} join->host")
                with rooms_lock:
                    rooms.pop(code, None)
                return

        # Timed out waiting
        print(f"[relay] room {code} timed out")
        with rooms_lock:
            rooms.pop(code, None)
        try: conn.close()
        except: pass

    elif raw.startswith("JOIN "):
        code = raw[5:].strip().upper()
        with rooms_lock:
            pair = rooms.get(code)
            if pair is None or pair[1] is not None:
                # Room doesn't exist or already full
                try:
                    conn.sendall(b"ERROR no such room\n")
                except: pass
                conn.close()
                return
            pair[1] = conn  # Register joiner

        try:
            conn.sendall(b"READY\n")
        except Exception:
            conn.close()
            return

        print(f"[relay] {addr} joined room {code}")
        # The host's thread is already watching and will start bridging

    else:
        print(f"[relay] unknown handshake: {raw!r}")
        conn.close()


def main():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind((HOST, PORT))
    server.listen()
    print(f"[relay] listening on {HOST}:{PORT}")
    while True:
        conn, addr = server.accept()
        threading.Thread(target=handle_client, args=(conn, addr), daemon=True).start()


if __name__ == "__main__":
    main()
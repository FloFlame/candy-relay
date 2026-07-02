# candy-relay

A tiny, dependency-free TCP relay server for peer-to-peer style matchmaking.
One player **hosts** a room and gets a short code; another player **joins**
with that code. Once both sides are connected, the server transparently
bridges the two sockets so traffic flows in both directions.

It's intended as a lightweight "hole-punch alternative": both peers make an
outbound TCP connection to the relay, so it works even when neither peer can
accept inbound connections.

## Protocol

The handshake is plain text, terminated by whitespace:

| Client sends   | Server replies        | Meaning                                    |
| -------------- | --------------------- | ------------------------------------------ |
| `HOST`         | `CODE <code>\n`       | A new room was created with the given code |
|                | `READY\n`             | A joiner arrived; bridging begins          |
| `JOIN <code>`  | `READY\n`             | Joined the room; bridging begins           |
|                | `ERROR no such room\n`| Room is unknown or already full            |

Room codes are 6 characters of uppercase letters and digits. After both
sides receive `READY`, every byte sent by one peer is forwarded verbatim to
the other until either side disconnects. A room that never gets a joiner is
discarded after a 5-minute timeout.

## Running

Requires only the Python standard library (Python 3.7+).

```bash
python main.py
```

The server listens on `0.0.0.0:5555` by default (see `HOST`/`PORT` in
`main.py`).

## Deploying

A `Procfile` is included for platforms like Railway or Heroku:

```
web: python main.py
```

## License

MIT — see [LICENSE](LICENSE).

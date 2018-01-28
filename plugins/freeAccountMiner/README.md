# freeAccountMiner plugin

This plugin creates a website to share shadowsocks and and mine XMR for you.

## Usage

### register in [coinhive](https://coinhive.com) and get a public key and private key.

### Quick start with docker

1. Make a config folder, and create file `default.yml` `free.yml` in it:

    ```
    default.yml:

    type: s
    shadowsocks:
      address: 127.0.0.1:6001
    manager:
      address: 127.0.0.1:6002
      password: '123456'
    db: 'db.sqlite'

    --------------------

    free.yml:

    type: m
    manager:
      address: 127.0.0.1:6002
      password: '123456'
    plugins:
      freeAccountMiner:
        use: true
        public: '3Y3EMOxKh7U9xKTBegLGAI6TacKOIGKB'
        private: 'uI57SsEppsGU295KfTCGqE7r3Z592JBa'
        speed: 0.45
        timeout: 900000
        price:
          flow: 500
          time: 20
        port: 50000-52500
        address: 'your.address'
        method: 'aes-256-cfb'
        listen: '0.0.0.0:80'
    db: 'free.sqlite'
    ```

2. run this command, the ports depends on your `free.yml` file:

    ```
    docker run --name types -idt -v /your/config/file/path:/root/.ssmgr --net=host gyteng/ssmgr ssmgr -c default.yml -r
    docker run --name typem -idt -v /your/config/file/path:/root/.ssmgr --net=host gyteng/ssmgr ssmgr -c free.yml
    ```

### Start in normal way

1. Start `ssmgr` with type s, you can read the guide [here](https://github.com/shadowsocks/shadowsocks-manager).

2. Create config file `~/.ssmgr/free.yml`:

    ```
    type: m
    manager:
      address: 127.0.0.1:6002
      password: '123456'
    plugins:
      freeAccountMiner:
        use: true
        public: '3Y3EMOxKh7U9xKTBegLGAI6TacKOIGKB'
        private: 'uI57SsEppsGU295KfTCGqE7r3Z592JBa'
        speed: 0.45
        timeout: 900000
        price:
          flow: 500
          time: 30
        port: 50000-52500
        address: 'your.address'
        method: 'aes-256-cfb'
        listen: '0.0.0.0:80'
    db: 'free.sqlite'
    ```

3. run `ssmgr -c free.yml`, and you can visit the website.

## Demo

[https://coin.ssmgr.top](https://coin.ssmgr.top)
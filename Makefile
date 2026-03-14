.PHONY: dev build clean install

dev:
	npm run dev

build:
	npm run build

clean:
	rm -rf dist node_modules

install:
	npm install

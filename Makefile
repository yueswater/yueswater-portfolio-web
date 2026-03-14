.PHONY: dev build clean install deploy

API_URL ?= http://localhost:8000
BUCKET = gs://yueswater-portfolio-web
LB_NAME = yueswater-portfolio-web-lb
PROJECT = yueswater-portfolio

dev:
	npm run dev

build:
	VITE_API_BASE=$(API_URL) npm run build

clean:
	rm -rf dist node_modules

install:
	npm install

deploy: build
	gcloud storage cp -r dist/* $(BUCKET)/
	gcloud compute url-maps invalidate-cdn-cache $(LB_NAME) --path="/*" --project=$(PROJECT)

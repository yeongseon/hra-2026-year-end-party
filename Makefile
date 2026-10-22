.PHONY: serve install check test
serve:
	python3 -m http.server 8000 --bind 127.0.0.1
install:
	npm ci
	npx playwright install chromium
check:
	npm run lint
	npm run test:static
test:
	npm test

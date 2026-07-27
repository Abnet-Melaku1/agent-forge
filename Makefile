.PHONY: gen-types

gen-types:
	uv run python -c "import sys; sys.path.insert(0, 'services/api'); from app.main import build_app; import json; app = build_app(); open('openapi.json', 'w', encoding='utf-8').write(json.dumps(app.openapi()))"
	npx openapi-typescript openapi.json -o packages/types/src/schema.ts
	uv run python -c "import os; os.remove('openapi.json')"

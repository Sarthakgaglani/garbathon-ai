.PHONY: help dev test replay check-size install

help:
	@echo "Scam Call Shield - Commands"
	@echo "  make install    - Install backend and frontend dependencies"
	@echo "  make dev        - Run FastAPI backend and Vite frontend"
	@echo "  make test       - Run backend test suite"
	@echo "  make replay     - Run offline replay verification"
	@echo "  make check-size - Check git repository size (<10MB limit)"

install:
	python -m pip install -r backend/requirements.txt
	cd frontend && npm install

dev-backend:
	python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

dev-frontend:
	cd frontend && npm run dev

test:
	python -m pytest backend/tests -v

replay:
	python -c "from backend.app.services.replay_cache import ReplayCache; rc = ReplayCache(); [print('Verified Cache:', c, 'Chunks:', len(rc.load_call_cache(c))) for c in ['scam_digital_arrest', 'scam_electricity_kyc', 'scam_bank_lottery', 'genuine_bank_support']]"

check-size:
	git count-objects -vH

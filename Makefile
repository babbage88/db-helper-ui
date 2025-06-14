GHCR_REPO:=ghcr.io/babbage88/dbhelperui:
BUILDER:=dbhelperui-builder
B2_BUCKET:=b2://db-bob
README_NAME:=README.md
tag:=v0.0.1
testtag:=test

check-builder:
	@if ! docker buildx inspect $(BUILDER) > /dev/null 2>&1; then \
		echo "Builder $(BUILDER) does not exist. Creating..."; \
    	docker buildx create --name $(BUILDER) --bootstrap; \
	fi

create-builder: check-builder


buildandpush: create-builder
	docker buildx use dbhelperui-builder
	docker buildx build --build-arg NODE_ENV=production --platform linux/amd64,linux/arm64 -t $(GHCR_REPO)$(tag) . --push

buildandpush-test:
	docker buildx use dbhelperui-builder
	docker buildx build --build-arg NODE_ENV=test --platform linux/amd64,linux/arm64 -t $(GHCR_REPO)$(testtag) . --push

deployk8s: buildandpush
	kubectl apply -f deployment/kubernetes/deployment.yaml
	kubectl rollout restart deployment dbhelperui

update-docs-b2:
	source b2/bin/activate && b2 file upload $(B2_BUCKET) $(README_NAME) $(README_NAME) 


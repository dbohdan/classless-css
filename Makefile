all: README.md

README.md: README.md.njk render-template.ts Makefile data/projects.toml package.json
	./render-template.ts README.md.njk data/projects.toml > $@

.PHONY: all

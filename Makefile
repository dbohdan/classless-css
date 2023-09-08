all: README.md

README.md: README.md.njk render-template.ts Makefile data/projects.toml
	./render-template.ts README.md.njk data/projects.toml > $@

.PHONY: all

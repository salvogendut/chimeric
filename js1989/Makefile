# SDL3/WebAssembly build. Native configure output is deliberately not included.
EMCC ?= emcc
EMXX ?= em++
BUILD_DIR = build
DIST_DIR = dist
BUILD_VERSION := $(shell awk -F'[][]' '/^AC_INIT/ {print $$4; exit}' ../configure.ac)
BUILD_COMMIT := $(shell git -C .. rev-parse --short HEAD 2>/dev/null || echo unknown)
# Share the native source manifest, excluding host networking for this milestone.
NATIVE_SOURCES := $(shell sed -n '/^1989_SOURCES =/,/^$$/p' ../Makefile.am | sed '1d;s/\\//g')
SOURCES := $(filter-out src/enet_slirp.c src/slirp/%,$(NATIVE_SOURCES))
OBJECTS := $(addprefix $(BUILD_DIR)/,$(addsuffix .o,$(SOURCES))) $(BUILD_DIR)/web_host.o
CPPFLAGS = -I. $(addprefix -I../src/,includes cpu debug softfloat dsp dimension slirp gui-sdl) -I../src \
	-DHAVE_CONFIG_H -DROM_INSTALL_DIR=\"/roms\" -DCONFDIR=\"/\" \
	-DPACKAGE_VERSION=\"$(BUILD_VERSION)\" -DPROG_GIT_COMMIT=\"$(BUILD_COMMIT)\"
COMMON = -O2 -g2 -pthread --use-port=sdl3 -fwrapv -MMD -MP
CFLAGS = $(COMMON) -std=gnu99
CXXFLAGS = $(COMMON) -std=gnu++17
LDFLAGS = -O2 -g2 -pthread --use-port=sdl3 -sPTHREAD_POOL_SIZE=6 \
	-sMODULARIZE -sEXPORT_NAME=create1989 -sFORCE_FILESYSTEM \
	-sINITIAL_MEMORY=268435456 -sMAXIMUM_MEMORY=1073741824 -sALLOW_MEMORY_GROWTH \
	-sSTACK_SIZE=4194304 -sDEFAULT_PTHREAD_STACK_SIZE=4194304 \
	-sEXPORTED_RUNTIME_METHODS=FS,callMain,ccall \
	-sEXPORTED_FUNCTIONS=_main,_web_key,_web_ready,_web_cycles,_web_pause,_web_paused,_web_eject,_web_insert,_web_media_present,_web_model_info,_web_set_model \
	--embed-file ../roms@/roms

.PHONY: all clean serve
all: $(DIST_DIR)/1989.js assets

$(DIST_DIR)/1989.js: $(OBJECTS) Makefile $(wildcard ../roms/*.BIN)
	@mkdir -p $(DIST_DIR)
	$(EMXX) $(OBJECTS) $(LDFLAGS) -o $@

$(BUILD_DIR)/src/%.c.o: ../src/%.c config.h Makefile
	@mkdir -p $(dir $@)
	$(EMCC) $(CPPFLAGS) $(CFLAGS) -c $< -o $@

$(BUILD_DIR)/src/%.cpp.o: ../src/%.cpp config.h Makefile
	@mkdir -p $(dir $@)
	$(EMXX) $(CPPFLAGS) $(CXXFLAGS) -c $< -o $@

$(BUILD_DIR)/web_host.o: web_host.c web_host.h config.h Makefile
	@mkdir -p $(dir $@)
	$(EMCC) $(CPPFLAGS) $(CFLAGS) -c $< -o $@

.PHONY: assets
assets:
	python3 assemble.py

serve: all
	python3 serve.py

clean:
	rm -rf $(BUILD_DIR) $(DIST_DIR)

-include $(OBJECTS:.o=.d)

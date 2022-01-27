include(GNUInstallDirs)

add_custom_command(
        OUTPUT ${output}
        WORKING_DIRECTORY ${PROJECT_DIR}
        COMMAND echo "Packaging verifier"
        COMMAND pkg
        ARGS ${entry}    --output ${CMAKE_INSTALL_BINDIR}/verifier
        )
        # DEPENDS ${entry} ${sources}
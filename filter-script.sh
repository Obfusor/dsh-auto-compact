#!/bin/sh
if [ "$GIT_AUTHOR_NAME" = "Johnathon Ye" ]; then
    export GIT_AUTHOR_NAME="Obfusor"
    export GIT_AUTHOR_EMAIL="Obfusor"
fi
if [ "$GIT_COMMITTER_NAME" = "Johnathon Ye" ]; then
    export GIT_COMMITTER_NAME="Obfusor"
    export GIT_COMMITTER_EMAIL="Obfusor"
fi

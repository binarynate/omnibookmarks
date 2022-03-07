BROWSER_NAME=$1
DIST_DIR_NAME=dist
OUTPUT_DIR_PATH="$DIST_DIR_NAME/omnibookmarks-$BROWSER_NAME"
mkdir $DIST_DIR_NAME
rm -rf $OUTPUT_DIR_PATH
mkdir $OUTPUT_DIR_PATH

ITEMS_TO_COPY=( "manifest.json" "background.js" "img" )

for itemName in "${ITEMS_TO_COPY[@]}"
do
    cp -rf $itemName $OUTPUT_DIR_PATH
done

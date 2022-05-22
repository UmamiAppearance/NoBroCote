#!/env/bin/env sh

echo "Testing success.test.js";
node ./test/success.test.js
successTestStatus=$?
echo "- done -"

echo "Testing errors.test.js";
node ./test/errors.test.js
errorsTestStatus=$?
echo "- done -"

if [ $successTestStatus -eq 0 ] && [ $errorsTestStatus -eq 1 ] 
then
    echo "Everthing works as expected"
    exit 0
else
    echo "Errors occured" >&2
    exit 1
fi

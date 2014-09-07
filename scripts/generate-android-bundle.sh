#!/bin/bash

set -e
set -u

BUNDLE_VERSION="0.1"

# save off meteor checkout dir as final target
cd "`dirname "$0"`"/..
CHECKOUT_DIR=`pwd`

export UNAME=`uname`

DIR=`mktemp -d -t generate-android-bundle-XXXXXXXX`
trap 'rm -rf "$DIR" >/dev/null 2>&1' 0

echo BUILDING IN "$DIR"

cd "$DIR"
chmod 755 .
umask 022

# Download Android SDK
if [ "$UNAME" == "Linux" ]; then
    # not guaranteed to have java yikes
    # let's just see if they have it and prompt to install?

    curl -O http://dl.google.com/android/android-sdk_r23.0.2-linux.tgz
    tar xzf android-sdk_r23.0.2-linux.tgz > /dev/null
    rm android-sdk_r23.0.2-linux.tgz

    mv android-sdk-linux android-sdk

    curl -O s3.amazonaws.com/android-bundle/jre-7u67-linux-i586.gz
    tar zxvf jre-7u67-linux-i586.gz > /dev/null
    rm jre-7u67-linux-i586.gz

    mv jre1.7.0_67 jre

else
    curl -O http://dl.google.com/android/android-sdk_r23.0.2-macosx.zip
    unzip android-sdk_r23.0.2-macosx.zip > /dev/null
    rm android-sdk_r23.0.2-macosx.zip

    mv android-sdk-macosx android-sdk
fi

{
    curl -O http://www.motorlogy.com/apache//ant/binaries/apache-ant-1.9.4-bin.tar.gz
    tar xzf apache-ant-1.9.4-bin.tar.gz
    rm apache-ant-1.9.4-bin.tar.gz

    # the below asks for confirmation... echo y seems to work lol

    # platform tools
    echo y | android-sdk/tools/android update sdk -t platform-tools -u

    # the platform that cordova likes
    echo y | android-sdk/tools/android update sdk -t android-19 -u

    # system image for android 19
    echo y | android-sdk/tools/android update sdk -t sys-img-armeabi-v7a-android-19 --all -u

    # build tools
    echo y | android-sdk/tools/android update sdk -t "build-tools-20.0.0" -u

    # intel HAXM
    # echo y | android-sdk/tools/android update sdk -t "extra-intel-Hardware_Accelerated_Execution_Manager" -u
    # android-sdk/tools/android create avd -t 1 -n test
} &> /dev/null

echo BUNDLING

cd "$DIR"
echo "${BUNDLE_VERSION}" > .bundle_version.txt

echo "going to save in: ${CHECKOUT_DIR}/android_bundle_${UNAME}_${BUNDLE_VERSION}.tar.gz"

tar czf "${CHECKOUT_DIR}/android_bundle_${UNAME}_${BUNDLE_VERSION}.tar.gz" . &> /dev/null

echo DONE
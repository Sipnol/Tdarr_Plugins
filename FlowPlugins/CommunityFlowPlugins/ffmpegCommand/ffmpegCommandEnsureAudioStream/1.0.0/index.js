"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Ensure Audio Stream',
    description: 'Ensure that the file has an audio stream with set codec and channel count',
    style: {
        borderColor: '#6efefc',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            label: 'Name of new audio stream',
            name: 'streamName',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Tdarr will add this name to the metadata title of the audio stream.',
        },
        {
            label: 'Delete Source when it is redundant',
            name: 'deleteSource',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Toggle whether the source stream should be deleted if the Stream gets Transcoded with the same channel count',
        },
        {
            label: 'Audio Encoder',
            name: 'audioEncoder',
            type: 'string',
            defaultValue: 'aac',
            inputUI: {
                type: 'dropdown',
                options: [
                    'aac',
                    'ac3',
                    'eac3',
                    'dca',
                    'flac',
                    'libopus',
                    'mp2',
                    'libmp3lame',
                    'truehd',
                ],
            },
            tooltip: 'Enter the desired audio codec',
        },
        {
            label: 'Language',
            name: 'language',
            type: 'string',
            defaultValue: 'en',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Tdarr will check to see if the stream language tag includes the tag you specify.'
                + ' Case-insensitive. One tag only',
        },
        {
            label: 'Channels',
            name: 'channels',
            type: 'number',
            defaultValue: '2',
            inputUI: {
                type: 'dropdown',
                options: [
                    '1',
                    '2',
                    '6',
                    '8',
                ],
            },
            tooltip: 'Enter the desired number of channels',
        },
        {
            label: 'Enable Bitrate',
            name: 'enableBitrate',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Toggle whether to enable setting audio bitrate',
        },
        {
            label: 'Bitrate',
            name: 'bitrate',
            type: 'string',
            defaultValue: '128k',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'enableBitrate',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Specify the audio bitrate for newly added channels',
        },
        {
            label: 'Enable Samplerate',
            name: 'enableSamplerate',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Toggle whether to enable setting audio samplerate',
        },
        {
            label: 'Samplerate',
            name: 'samplerate',
            type: 'string',
            defaultValue: '48k',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'enableSamplerate',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Specify the audio samplerate for newly added channels',
        },
        {
            label: 'Enable Upmixing',
            name: 'enableUpmixing',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Toggle whether to enable setting audio upmixing this'
                + 'will only get used if there is no higher channel count available',
        },
        {
            label: 'Upmixing pan filter',
            name: 'upmixingFilter',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'enableUpmixing',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Specify the audio filter for upmixing to desired channels',
        },
        {
            label: 'Enable Filter',
            name: 'enableFilter',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Toggle whether to enable an audio filter',
        },
        {
            label: 'Filter to run',
            name: 'normalFilter',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'enableFilter',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Specify the audio filter for modifying selected channels',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Continue to next plugin',
        },
    ],
}); };
exports.details = details;
var getHighest = function (first, second) {
    // @ts-expect-error channels
    if ((first === null || first === void 0 ? void 0 : first.channels) > (second === null || second === void 0 ? void 0 : second.channels)) {
        return first;
    }
    return second;
};
var attemptMakeStream = function (_a) {
    var args = _a.args, langTag = _a.langTag, streams = _a.streams, audioCodec = _a.audioCodec, audioEncoder = _a.audioEncoder, wantedChannelCount = _a.wantedChannelCount;
    var enableBitrate = Boolean(args.inputs.enableBitrate);
    var bitrate = String(args.inputs.bitrate);
    var enableSamplerate = Boolean(args.inputs.enableSamplerate);
    var samplerate = String(args.inputs.samplerate);
    var enableUpmixing = Boolean(args.inputs.enableUpmixing);
    var upmixingFilter = String(args.inputs.upmixingFilter);
    var enableFilter = Boolean(args.inputs.enableFilter);
    var normalFilter = String(args.inputs.normalFilter);
    var streamName = String(args.inputs.streamName);
    var deleteSource = String(args.inputs.deleteSource);
    var langMatch = function (stream) {
        var _a;
        return ((langTag === 'und'
            && (stream.tags === undefined || stream.tags.language === undefined))
            || (((_a = stream === null || stream === void 0 ? void 0 : stream.tags) === null || _a === void 0 ? void 0 : _a.language) && stream.tags.language.toLowerCase().includes(langTag)));
    };
    // filter streams to only include audio streams with the specified lang tag
    var streamsWithLangTag = streams.filter(function (stream) {
        if (stream.codec_type === 'audio'
            && stream.added === false
            && langMatch(stream)) {
            return true;
        }
        return false;
    });
    if (streamsWithLangTag.length === 0) {
        args.jobLog("No streams with language tag ".concat(langTag, " found. Skipping \n"));
        return false;
    }
    // get the stream with the highest channel count
    var streamWithHighestChannel = streamsWithLangTag.reduce(getHighest);
    var highestChannelCount = Number(streamWithHighestChannel.channels);
    var indexOfHighestChannel = streams.indexOf(streamWithHighestChannel);
    var targetChannels = 0;
    if (wantedChannelCount <= highestChannelCount) {
        targetChannels = wantedChannelCount;
        args.jobLog("The wanted channel count ".concat(wantedChannelCount, " is <= than the")
            + " highest available channel count (".concat(streamWithHighestChannel.channels, "). \n"));
    }
    else if (enableUpmixing) {
        targetChannels = wantedChannelCount;
        args.jobLog("The wanted channel count ".concat(wantedChannelCount, " is higher than the")
            + " highest available channel count (".concat(streamWithHighestChannel.channels, "). Will upmix audio.\n"));
    }
    else {
        targetChannels = highestChannelCount;
        args.jobLog("The wanted channel count ".concat(wantedChannelCount, " is higher than the")
            + " highest available channel count (".concat(streamWithHighestChannel.channels, "). \n"));
        return true;
    }
    var hasStreamAlready = streams.filter(function (stream) {
        if (stream.codec_type === 'audio'
            && langMatch(stream)
            && stream.codec_name === audioCodec
            && stream.channels === targetChannels) {
            return true;
        }
        return false;
    });
    if (hasStreamAlready.length > 0) {
        args.jobLog("File already has ".concat(langTag, " stream in ").concat(audioEncoder, ", ").concat(targetChannels, " channels \n"));
        return true;
    }
    if (deleteSource && targetChannels === highestChannelCount) {
        args.jobLog("Removing source at ".concat(indexOfHighestChannel));
        streams[indexOfHighestChannel].removed = true;
    }
    args.jobLog("Adding ".concat(langTag, " stream in ").concat(audioEncoder, ", ").concat(targetChannels, " channels \n"));
    var streamCopy = JSON.parse(JSON.stringify(streamWithHighestChannel));
    streamCopy.removed = false;
    streamCopy.added = true;
    streamCopy.index = streams.length;
    if (targetChannels > highestChannelCount && upmixingFilter !== '') {
        streamCopy.outputArgs.push('-filter_complex', "[".concat(streamCopy.mapArgs[1], "]").concat(upmixingFilter, "[a_{outputIndex}]"));
        streamCopy.outputArgs.push('-map', '[a_{outputIndex}]');
        streamCopy.mapArgs = [];
    }
    else if (enableFilter && normalFilter !== '') {
        streamCopy.outputArgs.push('-filter_complex', "[".concat(streamCopy.mapArgs[1], "]").concat(normalFilter, "[a_{outputIndex}]"));
        streamCopy.outputArgs.push('-map', '[a_{outputIndex}]');
        streamCopy.mapArgs = [];
    }
    else {
        streamCopy.outputArgs.push('-ac:a:{outputTypeIndex}', "".concat(targetChannels));
    }
    streamCopy.outputArgs.push('-c:a:{outputTypeIndex}', audioEncoder);
    if (enableBitrate) {
        streamCopy.outputArgs.push('-b:a:{outputTypeIndex}', "".concat(bitrate));
    }
    if (enableSamplerate) {
        streamCopy.outputArgs.push('-ar:a:{outputTypeIndex}', "".concat(samplerate));
    }
    if (streamName !== '') {
        streamCopy.outputArgs.push('-metadata:s:a:{outputTypeIndex}', "title=".concat(streamName));
    }
    // eslint-disable-next-line no-param-reassign
    args.variables.ffmpegCommand.shouldProcess = true;
    streams.push(streamCopy);
    return true;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    (0, flowUtils_1.checkFfmpegCommandInit)(args);
    var audioEncoder = String(args.inputs.audioEncoder);
    var langTag = String(args.inputs.language).toLowerCase();
    var wantedChannelCount = Number(args.inputs.channels);
    var streams = args.variables.ffmpegCommand.streams;
    var audioCodec = audioEncoder;
    if (audioEncoder === 'dca') {
        audioCodec = 'dts';
    }
    if (audioEncoder === 'libmp3lame') {
        audioCodec = 'mp3';
    }
    if (audioEncoder === 'libopus') {
        audioCodec = 'opus';
    }
    var addedOrExists = attemptMakeStream({
        args: args,
        langTag: langTag,
        streams: streams,
        audioCodec: audioCodec,
        audioEncoder: audioEncoder,
        wantedChannelCount: wantedChannelCount,
    });
    if (!addedOrExists) {
        attemptMakeStream({
            args: args,
            langTag: 'und',
            streams: streams,
            audioCodec: audioCodec,
            audioEncoder: audioEncoder,
            wantedChannelCount: wantedChannelCount,
        });
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;

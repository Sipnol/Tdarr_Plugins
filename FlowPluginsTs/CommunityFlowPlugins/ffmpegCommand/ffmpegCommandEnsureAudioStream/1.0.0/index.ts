import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IffmpegCommandStream,
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
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
      tooltip:
        'Tdarr will add this name to the metadata title of the audio stream.',
    },
    {
      label: 'Delete Source when it is redundant',
      name: 'deleteSource',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip:
        'Toggle whether the source stream should be deleted if the Stream gets Transcoded with the same channel count',
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
      tooltip:
        'Enter the desired audio codec',
    },
    {
      label: 'Language',
      name: 'language',
      type: 'string',
      defaultValue: 'en',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Tdarr will check to see if the stream language tag includes the tag you specify.'
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
      tooltip:
        'Enter the desired number of channels',
    },
    {
      label: 'Enable Bitrate',
      name: 'enableBitrate',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip:
        'Toggle whether to enable setting audio bitrate',
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
      tooltip:
        'Specify the audio bitrate for newly added channels',
    },
    {
      label: 'Enable Samplerate',
      name: 'enableSamplerate',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip:
        'Toggle whether to enable setting audio samplerate',
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
      tooltip:
        'Specify the audio samplerate for newly added channels',
    },
    {
      label: 'Enable Upmixing',
      name: 'enableUpmixing',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip:
        'Toggle whether to enable setting audio upmixing this'
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
      tooltip:
        'Specify the audio filter for upmixing to desired channels',
    },
    {
      label: 'Enable Filter',
      name: 'enableFilter',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip:
        'Toggle whether to enable an audio filter',
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
      tooltip:
        'Specify the audio filter for modifying selected channels',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

const getHighest = (first: IffmpegCommandStream, second: IffmpegCommandStream) => {
  // @ts-expect-error channels
  if (first?.channels > second?.channels) {
    return first;
  }
  return second;
};

const attemptMakeStream = ({
  args,
  langTag,
  streams,
  audioCodec,
  audioEncoder,
  wantedChannelCount,
}: {
  args: IpluginInputArgs,
  langTag: string
  streams: IffmpegCommandStream[],
  audioCodec: string,
  audioEncoder: string,
  wantedChannelCount: number,
}): boolean => {
  const enableBitrate = Boolean(args.inputs.enableBitrate);
  const bitrate = String(args.inputs.bitrate);
  const enableSamplerate = Boolean(args.inputs.enableSamplerate);
  const samplerate = String(args.inputs.samplerate);
  const enableUpmixing = Boolean(args.inputs.enableUpmixing);
  const upmixingFilter = String(args.inputs.upmixingFilter);
  const enableFilter = Boolean(args.inputs.enableFilter);
  const normalFilter = String(args.inputs.normalFilter);
  const streamName = String(args.inputs.streamName);
  const deleteSource = String(args.inputs.deleteSource);

  const langMatch = (stream: IffmpegCommandStream) => (
    (langTag === 'und'
      && (stream.tags === undefined || stream.tags.language === undefined))
      || (stream?.tags?.language && stream.tags.language.toLowerCase().includes(langTag)
      )
  );

  // filter streams to only include audio streams with the specified lang tag
  const streamsWithLangTag = streams.filter((stream) => {
    if (
      stream.codec_type === 'audio'
        && stream.added === false
        && langMatch(stream)
    ) {
      return true;
    }

    return false;
  });

  if (streamsWithLangTag.length === 0) {
    args.jobLog(`No streams with language tag ${langTag} found. Skipping \n`);
    return false;
  }

  // get the stream with the highest channel count
  const streamWithHighestChannel = streamsWithLangTag.reduce(getHighest);
  const highestChannelCount = Number(streamWithHighestChannel.channels);
  const indexOfHighestChannel = streams.indexOf(streamWithHighestChannel);

  let targetChannels = 0;
  if (wantedChannelCount <= highestChannelCount) {
    targetChannels = wantedChannelCount;
    args.jobLog(`The wanted channel count ${wantedChannelCount} is <= than the`
      + ` highest available channel count (${streamWithHighestChannel.channels}). \n`);
  } else if (enableUpmixing) {
    targetChannels = wantedChannelCount;
    args.jobLog(`The wanted channel count ${wantedChannelCount} is higher than the`
      + ` highest available channel count (${streamWithHighestChannel.channels}). Will upmix audio.\n`);
  } else {
    targetChannels = highestChannelCount;
    args.jobLog(`The wanted channel count ${wantedChannelCount} is higher than the`
      + ` highest available channel count (${streamWithHighestChannel.channels}). \n`);
    return true;
  }

  const hasStreamAlready = streams.filter((stream) => {
    if (
      stream.codec_type === 'audio'
      && langMatch(stream)
      && stream.codec_name === audioCodec
      && stream.channels === targetChannels
    ) {
      return true;
    }

    return false;
  });

  if (hasStreamAlready.length > 0) {
    args.jobLog(`File already has ${langTag} stream in ${audioEncoder}, ${targetChannels} channels \n`);
    return true;
  }

  if(deleteSource && targetChannels === highestChannelCount) {
    args.jobLog(`Removing source at ${indexOfHighestChannel}`);
    streams[indexOfHighestChannel].removed = true;
  }

  args.jobLog(`Adding ${langTag} stream in ${audioEncoder}, ${targetChannels} channels \n`);

  const streamCopy: IffmpegCommandStream = JSON.parse(JSON.stringify(streamWithHighestChannel));
  streamCopy.removed = false;
  streamCopy.added = true;
  streamCopy.index = streams.length;
  if (targetChannels > highestChannelCount && upmixingFilter !== '') {
    streamCopy.outputArgs.push('-filter_complex', `[${streamCopy.mapArgs[1]}]${upmixingFilter}[a_{outputIndex}]`);
    streamCopy.outputArgs.push('-map', '[a_{outputIndex}]');
    streamCopy.mapArgs = [];
  } else if(enableFilter && normalFilter !== ''){
    streamCopy.outputArgs.push('-filter_complex', `[${streamCopy.mapArgs[1]}]${normalFilter}[a_{outputIndex}]`);
    streamCopy.outputArgs.push('-map', '[a_{outputIndex}]');
    streamCopy.mapArgs = [];
  } else {
    streamCopy.outputArgs.push('-ac:a:{outputTypeIndex}', `${targetChannels}`);
  }
  streamCopy.outputArgs.push('-c:a:{outputTypeIndex}', audioEncoder);

  if (enableBitrate) {
    streamCopy.outputArgs.push('-b:a:{outputTypeIndex}', `${bitrate}`);
  }

  if (enableSamplerate) {
    streamCopy.outputArgs.push('-ar:a:{outputTypeIndex}', `${samplerate}`);
  }

  if (streamName !== '') {
    streamCopy.outputArgs.push('-metadata:s:a:{outputTypeIndex}', `title=${streamName}`);
  }

  // eslint-disable-next-line no-param-reassign
  args.variables.ffmpegCommand.shouldProcess = true;

  streams.push(streamCopy);

  return true;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  checkFfmpegCommandInit(args);

  const audioEncoder = String(args.inputs.audioEncoder);
  const langTag = String(args.inputs.language).toLowerCase();
  const wantedChannelCount = Number(args.inputs.channels);

  const { streams } = args.variables.ffmpegCommand;

  let audioCodec = audioEncoder;

  if (audioEncoder === 'dca') {
    audioCodec = 'dts';
  }

  if (audioEncoder === 'libmp3lame') {
    audioCodec = 'mp3';
  }

  if (audioEncoder === 'libopus') {
    audioCodec = 'opus';
  }

  const addedOrExists = attemptMakeStream({
    args,
    langTag,
    streams,
    audioCodec,
    audioEncoder,
    wantedChannelCount,
  });

  if (!addedOrExists) {
    attemptMakeStream({
      args,
      langTag: 'und',
      streams,
      audioCodec,
      audioEncoder,
      wantedChannelCount,
    });
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};

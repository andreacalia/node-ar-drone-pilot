var _ = require('lodash');

const DEFAULT_COMMANDS = [
    {
        code: 'takeoff',
        command: 'takeoff()'
    },
    {
        code: 'land',
        command: 'land()'
    },
    {
        code: 'calibrate',
        command: 'calibrate(0)'
    },
    {
        code: 'enable-bottom-camera',
        command: 'config("video:video_channel", 3)'
    },
    {
        code: 'enable-front-camera',
        command: 'config("video:video_channel", 0)'
    },
    {
        code: 'initiator',
        command: 'front(0.035)'
    },
    {
        code: 'stop',
        command: 'stop()'
    }
];

const CONFIGURABLE_COMMANDS = [
    {
        code: 'a',
        command: `right(0.035)`,
        final: true
    },
    {
        code: 'b',
        command: 'NOTYETASSIGNED',
        start: true
    },
    {
        code: 'c',
        command: 'NOTYETASSIGNED'
    },
    {
        code: 'd',
        command: 'NOTYETASSIGNED'
    },
    {
        code: 'e',
        command: 'NOTYETASSIGNED'
    }
]

module.exports = {

    getCommand: function(code) {

        const command = _.find(_.union(DEFAULT_COMMANDS, CONFIGURABLE_COMMANDS), (command) => command.code === code);
        return command.command;

    },

    isValidCode: function(code) {

        return _.some(_.union(DEFAULT_COMMANDS, CONFIGURABLE_COMMANDS), (command) => command.code === code);

    },

    isConfigurableCode: function(code) {

        return _.some(CONFIGURABLE_COMMANDS, (command) => command.code === code);

    },

    isDefaultCode: function(code) {

        return _.some(DEFAULT_COMMANDS, (command) => command.code === code);

    },

    isFinalCode: function(code) {

        const command = _.find(_.union(DEFAULT_COMMANDS, CONFIGURABLE_COMMANDS), (command) => command.code === code);
        return !!command.final;

    },

    isStartCode: function(code) {

        const command = _.find(_.union(DEFAULT_COMMANDS, CONFIGURABLE_COMMANDS), (command) => command.code === code);
        return !!command.start;

    }

};

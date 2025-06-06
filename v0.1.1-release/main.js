/**
 * Base provider class that defines the interface calendar modules should implement
 */
class BaseCalendarProvider {
    // Default implementations for optional methods
    getSunriseSunset(date) {
        // Default: 6 AM sunrise, 6 PM sunset
        const dayStart = this.dateToWorldTime({
            ...date,
            time: { hour: 0, minute: 0, second: 0 }
        });
        return {
            sunrise: dayStart + (6 * 3600), // 6 AM
            sunset: dayStart + (18 * 3600) // 6 PM
        };
    }
    getSeasonInfo(date) {
        // Default seasonal calculation based on month (Northern Hemisphere)
        const month = date.month;
        if (month >= 3 && month <= 5) {
            return { icon: 'spring', name: 'Spring' };
        }
        else if (month >= 6 && month <= 8) {
            return { icon: 'summer', name: 'Summer' };
        }
        else if (month >= 9 && month <= 11) {
            return { icon: 'fall', name: 'Fall' };
        }
        else {
            return { icon: 'winter', name: 'Winter' };
        }
    }
    getYearFormatting() {
        return { prefix: '', suffix: '' };
    }
    // Optional GM methods - default to no-op
    async advanceDays(days) {
        console.warn(`${this.name} provider does not support time advancement`);
    }
    async advanceHours(hours) {
        console.warn(`${this.name} provider does not support time advancement`);
    }
    async advanceMinutes(minutes) {
        console.warn(`${this.name} provider does not support time advancement`);
    }
    // Utility methods
    getOrdinalSuffix(day) {
        if (day >= 11 && day <= 13) {
            return 'th';
        }
        const lastDigit = day % 10;
        switch (lastDigit) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }
    validateMonth(month, monthNames) {
        return month >= 1 && month <= monthNames.length;
    }
    getCurrentTimestamp() {
        return game.time?.worldTime || 0;
    }
}

/**
 * Seasons & Stars calendar provider
 */
class SeasonsStarsProvider extends BaseCalendarProvider {
    name = 'Seasons & Stars';
    version;
    constructor() {
        super();
        this.version = game.modules.get('seasons-and-stars')?.version || '0.1.0';
    }
    static isAvailable() {
        const module = game.modules.get('seasons-and-stars');
        const api = game.seasonsStars?.api;
        console.log('🌟 Seasons & Stars Provider Debug:');
        console.log('  - module:', module);
        console.log('  - module.active:', module?.active);
        console.log('  - game.seasonsStars:', game.seasonsStars);
        console.log('  - game.seasonsStars.api:', api);
        return !!(module?.active && api);
    }
    getCurrentDate() {
        try {
            const ssDate = game.seasonsStars?.api?.getCurrentDate();
            if (!ssDate)
                return null;
            return {
                year: ssDate.year,
                month: ssDate.month,
                day: ssDate.day,
                weekday: ssDate.weekday || 0,
                time: ssDate.time || { hour: 0, minute: 0, second: 0 }
            };
        }
        catch (error) {
            console.warn('Failed to get current date from Seasons & Stars:', error);
            return null;
        }
    }
    worldTimeToDate(timestamp) {
        try {
            const ssDate = game.seasonsStars.api.worldTimeToDate(timestamp);
            return {
                year: ssDate.year,
                month: ssDate.month,
                day: ssDate.day,
                weekday: ssDate.weekday || 0,
                time: ssDate.time || { hour: 0, minute: 0, second: 0 }
            };
        }
        catch (error) {
            console.warn('Failed to convert timestamp to date:', error);
            // Fallback to basic conversion
            const days = Math.floor(timestamp / 86400);
            return {
                year: 2023,
                month: 1,
                day: days + 1,
                weekday: 0,
                time: {
                    hour: Math.floor((timestamp % 86400) / 3600),
                    minute: Math.floor((timestamp % 3600) / 60),
                    second: timestamp % 60
                }
            };
        }
    }
    dateToWorldTime(date) {
        try {
            return game.seasonsStars.api.dateToWorldTime(date);
        }
        catch (error) {
            console.warn('Failed to convert date to timestamp:', error);
            // Fallback calculation
            return (date.day - 1) * 86400 +
                (date.time?.hour || 0) * 3600 +
                (date.time?.minute || 0) * 60 +
                (date.time?.second || 0);
        }
    }
    formatDate(date, options) {
        try {
            if (options?.timeOnly) {
                const hour = (date.time?.hour || 0).toString().padStart(2, '0');
                const minute = (date.time?.minute || 0).toString().padStart(2, '0');
                return `${hour}:${minute}`;
            }
            if (options?.includeTime === false) {
                return game.seasonsStars?.api?.formatDate ?
                    game.seasonsStars.api.formatDate(date, { includeTime: false }) :
                    `${date.day}/${date.month}/${date.year}`;
            }
            return game.seasonsStars?.api?.formatDate ?
                game.seasonsStars.api.formatDate(date, options) :
                `${date.day}/${date.month}/${date.year}`;
        }
        catch (error) {
            console.warn('Failed to format date:', error);
            if (options?.timeOnly) {
                const hour = (date.time?.hour || 0).toString().padStart(2, '0');
                const minute = (date.time?.minute || 0).toString().padStart(2, '0');
                return `${hour}:${minute}`;
            }
            return `${date.day}/${date.month}/${date.year}`;
        }
    }
    getActiveCalendar() {
        try {
            return game.seasonsStars.api.getActiveCalendar();
        }
        catch (error) {
            console.warn('Failed to get active calendar:', error);
            return null;
        }
    }
    getMonthNames() {
        try {
            const calendar = this.getActiveCalendar();
            return calendar?.months?.map((m) => m.name) || [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
        }
        catch (error) {
            console.warn('Failed to get month names:', error);
            return [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
        }
    }
    getWeekdayNames() {
        try {
            const calendar = this.getActiveCalendar();
            return calendar?.weekdays?.map((w) => w.name) || [
                'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
            ];
        }
        catch (error) {
            console.warn('Failed to get weekday names:', error);
            return [
                'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
            ];
        }
    }
    getSunriseSunset(date) {
        try {
            // Try to get from calendar if it has astronomical data
            const calendar = this.getActiveCalendar();
            if (calendar?.astronomy) {
                // Use calendar-specific astronomical calculations if available
                return super.getSunriseSunset(date);
            }
            return super.getSunriseSunset(date);
        }
        catch (error) {
            console.warn('Failed to calculate sunrise/sunset:', error);
            return super.getSunriseSunset(date);
        }
    }
    getSeasonInfo(date) {
        try {
            const calendar = this.getActiveCalendar();
            if (calendar?.seasons && calendar.seasons.length > 0) {
                // Use calendar-defined seasons if available
                const monthsPerSeason = Math.ceil(calendar.months.length / calendar.seasons.length);
                const seasonIndex = Math.floor((date.month - 1) / monthsPerSeason);
                const season = calendar.seasons[seasonIndex];
                if (season) {
                    return {
                        icon: season.icon || season.name.toLowerCase(),
                        name: season.name
                    };
                }
            }
            return super.getSeasonInfo(date);
        }
        catch (error) {
            console.warn('Failed to get season info:', error);
            return super.getSeasonInfo(date);
        }
    }
    getYearFormatting() {
        try {
            const calendar = this.getActiveCalendar();
            return {
                prefix: calendar?.year?.prefix || '',
                suffix: calendar?.year?.suffix || ''
            };
        }
        catch (error) {
            console.warn('Failed to get year formatting:', error);
            return super.getYearFormatting();
        }
    }
    // GM time advancement methods
    async advanceDays(days) {
        try {
            if (game.seasonsStars?.api?.advanceDays) {
                await game.seasonsStars.api.advanceDays(days);
            }
            else {
                console.warn('Seasons & Stars does not support day advancement');
            }
        }
        catch (error) {
            console.error('Failed to advance days:', error);
            throw error;
        }
    }
    async advanceHours(hours) {
        try {
            if (game.seasonsStars?.api?.advanceHours) {
                await game.seasonsStars.api.advanceHours(hours);
            }
            else {
                console.warn('Seasons & Stars does not support hour advancement');
            }
        }
        catch (error) {
            console.error('Failed to advance hours:', error);
            throw error;
        }
    }
    async advanceMinutes(minutes) {
        try {
            if (game.seasonsStars?.api?.advanceMinutes) {
                await game.seasonsStars.api.advanceMinutes(minutes);
            }
            else {
                console.warn('Seasons & Stars does not support minute advancement');
            }
        }
        catch (error) {
            console.error('Failed to advance minutes:', error);
            throw error;
        }
    }
}

/**
 * Seasons & Stars Integration Provider for Simple Calendar Compatibility Bridge
 *
 * Uses the new SeasonsStarsIntegration interface for clean, robust integration
 * without direct DOM manipulation or legacy API dependencies.
 */
var WidgetPreference$1;
(function (WidgetPreference) {
    WidgetPreference["MAIN"] = "main";
    WidgetPreference["MINI"] = "mini";
    WidgetPreference["GRID"] = "grid";
    WidgetPreference["ANY"] = "any";
})(WidgetPreference$1 || (WidgetPreference$1 = {}));
/**
 * Enhanced provider using the new S&S integration interface
 */
class SeasonsStarsIntegrationProvider {
    name = 'Seasons & Stars (Integration)';
    version;
    integration = null;
    dateChangeCallback;
    calendarChangeCallback;
    widgetChangeCallback;
    constructor() {
        this.integration = this.detectIntegration();
        this.version = this.integration?.version || '0.0.0';
        if (this.integration) {
            this.setupHookListeners();
        }
    }
    /**
     * Detect S&S integration using new interface
     */
    detectIntegration() {
        try {
            // Try new integration interface first (S&S v2.0+)
            const integration = game.seasonsStars?.integration;
            if (integration && integration.isAvailable) {
                console.log('Bridge: Using S&S integration interface v' + integration.version);
                return integration;
            }
            // Try static detection method
            if (window.SeasonsStars?.integration?.detect) {
                const detected = window.SeasonsStars.integration.detect();
                if (detected && detected.isAvailable) {
                    console.log('Bridge: Detected S&S integration v' + detected.version);
                    return detected;
                }
            }
            // Fallback: try to create integration from legacy API
            if (game.seasonsStars?.api && game.seasonsStars?.manager) {
                console.log('Bridge: Creating integration wrapper for legacy S&S API');
                return this.createLegacyIntegrationWrapper();
            }
            return null;
        }
        catch (error) {
            console.error('Bridge: Failed to detect S&S integration:', error);
            return null;
        }
    }
    /**
     * Create integration wrapper for older S&S versions
     */
    createLegacyIntegrationWrapper() {
        const api = game.seasonsStars.api;
        game.seasonsStars.manager;
        return {
            isAvailable: true,
            version: game.modules?.get('seasons-and-stars')?.version || '1.x.x',
            api: api,
            widgets: this.createLegacyWidgetWrapper(),
            hooks: this.createLegacyHookWrapper(),
            hasFeature: (feature) => {
                // Basic feature detection for legacy versions
                switch (feature) {
                    case 'basic-api':
                        return true;
                    case 'widget-buttons':
                        return this.hasWidgetButtonSupport();
                    case 'time-advancement':
                        return typeof api.advanceDays === 'function';
                    default:
                        return false;
                }
            },
            getFeatureVersion: (feature) => {
                return this.hasFeature(feature) ? this.version : null;
            }
        };
    }
    createLegacyWidgetWrapper() {
        return {
            get main() { return this.wrapWidget('CalendarWidget'); },
            get mini() { return this.wrapWidget('CalendarMiniWidget'); },
            get grid() { return this.wrapWidget('CalendarGridWidget'); },
            getPreferredWidget: (preference = WidgetPreference$1.ANY) => {
                const mini = this.wrapWidget('CalendarMiniWidget');
                const main = this.wrapWidget('CalendarWidget');
                const grid = this.wrapWidget('CalendarGridWidget');
                switch (preference) {
                    case WidgetPreference$1.MINI: return mini;
                    case WidgetPreference$1.MAIN: return main;
                    case WidgetPreference$1.GRID: return grid;
                    default: return mini || main || grid;
                }
            },
            onWidgetChange: () => { },
            offWidgetChange: () => { },
            wrapWidget(widgetClassName) {
                const widgetClass = window.SeasonsStars?.[widgetClassName];
                const instance = widgetClass?.getInstance?.();
                if (!instance)
                    return null;
                return {
                    id: widgetClassName.toLowerCase(),
                    isVisible: instance.rendered || false,
                    addSidebarButton: (name, icon, tooltip, callback) => {
                        if (typeof instance.addSidebarButton === 'function') {
                            instance.addSidebarButton(name, icon, tooltip, callback);
                        }
                        else {
                            throw new Error(`Widget ${widgetClassName} does not support sidebar buttons`);
                        }
                    },
                    removeSidebarButton: (name) => {
                        if (typeof instance.removeSidebarButton === 'function') {
                            instance.removeSidebarButton(name);
                        }
                    },
                    hasSidebarButton: (name) => {
                        return typeof instance.hasSidebarButton === 'function' ?
                            instance.hasSidebarButton(name) : false;
                    },
                    getInstance: () => instance
                };
            }
        };
    }
    createLegacyHookWrapper() {
        return {
            onDateChanged: (callback) => {
                Hooks.on('seasons-stars:dateChanged', callback);
            },
            onCalendarChanged: (callback) => {
                Hooks.on('seasons-stars:calendarChanged', callback);
            },
            onReady: (callback) => {
                Hooks.on('seasons-stars:ready', callback);
            },
            off: (hookName, callback) => {
                Hooks.off(hookName, callback);
            }
        };
    }
    hasWidgetButtonSupport() {
        const widgets = ['CalendarWidget', 'CalendarMiniWidget', 'CalendarGridWidget'];
        for (const widgetName of widgets) {
            const widgetClass = window.SeasonsStars?.[widgetName];
            const instance = widgetClass?.getInstance?.();
            if (instance && typeof instance.addSidebarButton === 'function') {
                return true;
            }
        }
        return false;
    }
    /**
     * Setup hook listeners for S&S events
     */
    setupHookListeners() {
        if (!this.integration)
            return;
        // Listen for date changes
        this.dateChangeCallback = (event) => {
            // Translate to Simple Calendar hook format if needed
            Hooks.callAll('simple-calendar-date-time-change', {
                date: this.convertToSimpleCalendarFormat(event.newDate),
                moons: this.getAllMoons(),
                seasons: this.getAllSeasons()
            });
        };
        this.integration.hooks.onDateChanged(this.dateChangeCallback);
        // Listen for calendar changes
        this.calendarChangeCallback = (event) => {
            console.log('Bridge: Calendar changed from', event.oldCalendarId, 'to', event.newCalendarId);
        };
        this.integration.hooks.onCalendarChanged(this.calendarChangeCallback);
        // Listen for widget changes
        this.widgetChangeCallback = (widgets) => {
            console.log('Bridge: Widgets changed, available:', {
                main: !!widgets.main,
                mini: !!widgets.mini,
                grid: !!widgets.grid
            });
        };
        this.integration.widgets.onWidgetChange(this.widgetChangeCallback);
    }
    /**
     * Check if S&S is available with integration interface
     */
    static isAvailable() {
        // Check for module
        const module = game.modules?.get('seasons-and-stars');
        if (!module?.active) {
            return false;
        }
        // Check for either new integration or legacy API
        const hasIntegration = !!game.seasonsStars?.integration?.isAvailable;
        const hasLegacyAPI = !!game.seasonsStars?.api;
        return hasIntegration || hasLegacyAPI;
    }
    /**
     * Get integration instance for direct access
     */
    getIntegration() {
        return this.integration;
    }
    // CalendarProvider interface implementation
    getCurrentDate() {
        if (!this.integration?.api)
            return null;
        try {
            return this.integration.api.getCurrentDate();
        }
        catch (error) {
            console.error('Bridge: Failed to get current date:', error);
            return null;
        }
    }
    worldTimeToDate(timestamp) {
        if (!this.integration?.api) {
            throw new Error('S&S integration not available');
        }
        return this.integration.api.worldTimeToDate(timestamp);
    }
    dateToWorldTime(date) {
        if (!this.integration?.api) {
            throw new Error('S&S integration not available');
        }
        return this.integration.api.dateToWorldTime(date);
    }
    formatDate(date, options) {
        if (!this.integration?.api) {
            throw new Error('S&S integration not available');
        }
        return this.integration.api.formatDate(date, options);
    }
    getActiveCalendar() {
        if (!this.integration?.api)
            return null;
        return this.integration.api.getActiveCalendar();
    }
    getMonthNames() {
        if (!this.integration?.api)
            return [];
        try {
            return this.integration.api.getMonthNames();
        }
        catch (error) {
            console.error('Bridge: Failed to get month names:', error);
            return [];
        }
    }
    getWeekdayNames() {
        if (!this.integration?.api)
            return [];
        try {
            return this.integration.api.getWeekdayNames();
        }
        catch (error) {
            console.error('Bridge: Failed to get weekday names:', error);
            return [];
        }
    }
    async advanceDays(days) {
        if (!this.integration?.api?.advanceDays) {
            throw new Error('Time advancement not supported');
        }
        return this.integration.api.advanceDays(days);
    }
    async advanceHours(hours) {
        if (!this.integration?.api?.advanceHours) {
            throw new Error('Time advancement not supported');
        }
        return this.integration.api.advanceHours(hours);
    }
    async advanceMinutes(minutes) {
        if (!this.integration?.api?.advanceMinutes) {
            throw new Error('Time advancement not supported');
        }
        return this.integration.api.advanceMinutes(minutes);
    }
    getSunriseSunset(date) {
        if (this.integration?.api?.getSunriseSunset) {
            return this.integration.api.getSunriseSunset(date);
        }
        // Default fallback
        const dayStart = this.dateToWorldTime({
            ...date,
            time: { hour: 0, minute: 0, second: 0 }
        });
        return {
            sunrise: dayStart + (6 * 3600), // 6 AM
            sunset: dayStart + (18 * 3600) // 6 PM
        };
    }
    getSeasonInfo(date) {
        if (this.integration?.api?.getSeasonInfo) {
            return this.integration.api.getSeasonInfo(date);
        }
        // Default seasonal calculation
        const month = date.month;
        if (month >= 3 && month <= 5) {
            return { icon: 'spring', name: 'Spring' };
        }
        else if (month >= 6 && month <= 8) {
            return { icon: 'summer', name: 'Summer' };
        }
        else if (month >= 9 && month <= 11) {
            return { icon: 'fall', name: 'Fall' };
        }
        else {
            return { icon: 'winter', name: 'Winter' };
        }
    }
    /**
     * Add sidebar button to preferred widget
     */
    addSidebarButton(name, icon, tooltip, callback) {
        if (!this.integration?.widgets) {
            throw new Error('Widget integration not available');
        }
        const widget = this.integration.widgets.getPreferredWidget(WidgetPreference$1.MINI);
        if (widget) {
            widget.addSidebarButton(name, icon, tooltip, callback);
        }
        else {
            console.warn('Bridge: No widgets available for sidebar button integration');
        }
    }
    /**
     * Remove sidebar button from widgets
     */
    removeSidebarButton(name) {
        if (!this.integration?.widgets)
            return;
        for (const widget of [this.integration.widgets.mini, this.integration.widgets.main, this.integration.widgets.grid]) {
            if (widget) {
                widget.removeSidebarButton(name);
            }
        }
    }
    /**
     * Convert S&S date format to Simple Calendar format
     */
    convertToSimpleCalendarFormat(ssDate) {
        const monthNames = this.getMonthNames();
        const weekdayNames = this.getWeekdayNames();
        const sunriseSunset = this.getSunriseSunset(ssDate);
        const seasonInfo = this.getSeasonInfo(ssDate);
        return {
            year: ssDate.year,
            month: ssDate.month - 1, // SC uses 0-based months
            day: ssDate.day - 1, // SC uses 0-based days
            dayOfTheWeek: ssDate.weekday - 1, // SC uses 0-based weekdays
            hour: ssDate.time?.hour || 0,
            minute: ssDate.time?.minute || 0,
            second: ssDate.time?.second || 0,
            sunrise: sunriseSunset.sunrise,
            sunset: sunriseSunset.sunset,
            display: {
                date: this.formatDate(ssDate),
                time: this.formatTime(ssDate),
                weekday: weekdayNames[ssDate.weekday - 1] || '',
                day: ssDate.day.toString(),
                monthName: monthNames[ssDate.month - 1] || '',
                month: ssDate.month.toString(),
                year: ssDate.year.toString(),
                daySuffix: this.getOrdinalSuffix(ssDate.day),
                yearPrefix: '',
                yearPostfix: ''
            },
            weekdays: weekdayNames,
            showWeekdayHeadings: true,
            currentSeason: {
                icon: seasonInfo.icon
            }
        };
    }
    formatTime(date) {
        if (!date.time)
            return '00:00:00';
        const hour = date.time.hour.toString().padStart(2, '0');
        const minute = date.time.minute.toString().padStart(2, '0');
        const second = date.time.second.toString().padStart(2, '0');
        return `${hour}:${minute}:${second}`;
    }
    getOrdinalSuffix(day) {
        if (day >= 11 && day <= 13) {
            return 'th';
        }
        const lastDigit = day % 10;
        switch (lastDigit) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }
    getAllMoons() {
        // Default empty moons - can be enhanced with S&S moon data if available
        return [];
    }
    getAllSeasons() {
        // Default seasons - can be enhanced with S&S season data if available
        return [
            { name: 'Spring', icon: 'spring' },
            { name: 'Summer', icon: 'summer' },
            { name: 'Fall', icon: 'fall' },
            { name: 'Winter', icon: 'winter' }
        ];
    }
    /**
     * Cleanup integration resources
     */
    cleanup() {
        if (this.integration) {
            if (this.dateChangeCallback) {
                this.integration.hooks.off('dateChanged', this.dateChangeCallback);
            }
            if (this.calendarChangeCallback) {
                this.integration.hooks.off('calendarChanged', this.calendarChangeCallback);
            }
            if (this.widgetChangeCallback) {
                this.integration.widgets.offWidgetChange(this.widgetChangeCallback);
            }
        }
    }
}

/**
 * Simple Calendar API implementation that bridges to Seasons & Stars Integration Interface
 */
// Simple Calendar Icon Constants - Required by Simple Weather and other modules
const Icons = {
    Fall: 'fall',
    Winter: 'winter',
    Spring: 'spring',
    Summer: 'summer'
};
var WidgetPreference;
(function (WidgetPreference) {
    WidgetPreference["MAIN"] = "main";
    WidgetPreference["MINI"] = "mini";
    WidgetPreference["GRID"] = "grid";
    WidgetPreference["ANY"] = "any";
})(WidgetPreference || (WidgetPreference = {}));
/**
 * Simple Calendar API Bridge implementation
 *
 * Provides 100% Simple Calendar API compatibility by bridging to Seasons & Stars
 * Integration Interface. Handles all format conversions, CSS/DOM compatibility,
 * and Simple Calendar-specific quirks while maintaining complete separation
 * from the underlying calendar system.
 *
 * @example
 * ```typescript
 * // Automatic integration with S&S
 * const api = new SimpleCalendarAPIBridge();
 *
 * // Use standard Simple Calendar API
 * const currentDate = api.getCurrentDate();
 * await api.advanceDays(1);
 * ```
 */
class SimpleCalendarAPIBridge {
    /** Seasons & Stars integration interface */
    seasonsStars = null;
    /** Clock running state for SmallTime integration */
    clockRunning = false;
    /** Registry of sidebar buttons added by other modules */
    sidebarButtons = [];
    /**
     * Initialize the Simple Calendar API bridge
     *
     * @param seasonsStarsIntegration - Optional S&S integration instance, auto-detected if not provided
     */
    constructor(seasonsStarsIntegration) {
        this.seasonsStars = seasonsStarsIntegration || this.detectSeasonsStars();
        if (this.seasonsStars) {
            console.log(`Simple Calendar API bridging to Seasons & Stars v${this.seasonsStars.version} via Integration Interface`);
            this.setupHookBridging();
        }
        else {
            console.warn('Simple Calendar API Bridge: No Seasons & Stars integration available, using fallback mode');
        }
    }
    /**
     * Detect Seasons & Stars integration
     */
    detectSeasonsStars() {
        try {
            // Try S&S integration interface first (v2.0+)
            const integration = game.seasonsStars?.integration;
            if (integration && integration.isAvailable) {
                return integration;
            }
            // Try static detection method
            if (window.SeasonsStars?.integration?.detect) {
                const detected = window.SeasonsStars.integration.detect();
                if (detected && detected.isAvailable) {
                    return detected;
                }
            }
            return null;
        }
        catch (error) {
            console.error('Failed to detect S&S integration:', error);
            return null;
        }
    }
    /**
     * Setup hook bridging to translate S&S events to Simple Calendar format
     */
    setupHookBridging() {
        if (!this.seasonsStars)
            return;
        this.seasonsStars.hooks.onDateChanged((event) => {
            const scDate = this.convertSSToSCFormat(event.newDate);
            Hooks.callAll('simple-calendar-date-time-change', {
                date: scDate,
                moons: this.getAllMoons(),
                seasons: this.getAllSeasons()
            });
        });
        this.seasonsStars.hooks.onCalendarChanged((event) => {
            console.log('Bridge: Calendar changed from', event.oldCalendarId, 'to', event.newCalendarId);
        });
    }
    // Core time functions
    /**
     * Get current world time timestamp
     *
     * @returns Current Foundry world time in seconds
     */
    timestamp() {
        return game.time?.worldTime || 0;
    }
    /**
     * Convert Foundry timestamp to Simple Calendar date format
     *
     * Critical method for Simple Weather integration. Provides complete date
     * information including formatted display properties for UI rendering.
     *
     * @param timestamp - Foundry world time in seconds
     * @returns Complete Simple Calendar date object with display formatting
     *
     * @example
     * ```typescript
     * const dateInfo = SimpleCalendar.api.timestampToDate(game.time.worldTime);
     * console.log(`Today is ${dateInfo.display.monthName} ${dateInfo.display.day}${dateInfo.display.daySuffix}`);
     * // Output: "Today is December 25th"
     * ```
     */
    timestampToDate(timestamp) {
        try {
            if (!this.seasonsStars?.api) {
                return this.createFallbackDate(timestamp);
            }
            // Use S&S API to convert timestamp to date
            const ssDate = this.seasonsStars.api.worldTimeToDate(timestamp);
            // Convert S&S date format to Simple Calendar format
            return this.convertSSToSCFormat(ssDate);
        }
        catch (error) {
            console.error('🌉 Failed to convert timestamp to Simple Calendar date:', error);
            return this.createFallbackDate(timestamp);
        }
    }
    /**
     * Convert S&S CalendarDate format to Simple Calendar format
     */
    convertSSToSCFormat(ssDate) {
        if (!this.seasonsStars?.api) {
            throw new Error('S&S API not available for date conversion');
        }
        const monthNames = this.seasonsStars.api.getMonthNames();
        const weekdayNames = this.seasonsStars.api.getWeekdayNames();
        const sunriseSunset = this.seasonsStars.api.getSunriseSunset?.(ssDate) || { sunrise: 6, sunset: 18 };
        const seasonInfo = this.seasonsStars.api.getSeasonInfo?.(ssDate) || { icon: 'none'};
        // Validate month for safe array access
        const monthName = (ssDate.month >= 1 && ssDate.month <= monthNames.length) ?
            monthNames[ssDate.month - 1] : 'Unknown Month';
        // Validate weekday for safe array access (S&S uses 0-based weekdays like Simple Calendar)
        const weekdayName = (ssDate.weekday >= 0 && ssDate.weekday < weekdayNames.length) ?
            weekdayNames[ssDate.weekday] : 'Unknown Day';
        // Ensure we have valid string values
        const safeWeekdayName = weekdayName || 'Unknown Day';
        const safeMonthName = monthName || 'Unknown Month';
        const formattedDate = this.seasonsStars.api.formatDate(ssDate, { includeTime: false });
        const formattedTime = this.seasonsStars.api.formatDate(ssDate, { timeOnly: true });
        // Get calendar metadata for year formatting
        const activeCalendar = this.seasonsStars.api.getActiveCalendar();
        const yearPrefix = activeCalendar?.year?.prefix || '';
        const yearSuffix = activeCalendar?.year?.suffix || '';
        return {
            year: ssDate.year,
            month: ssDate.month - 1, // Convert 1-based to 0-based for SC compatibility
            day: ssDate.day - 1, // Convert 1-based to 0-based for SC compatibility
            dayOfTheWeek: ssDate.weekday, // Already 0-based, no conversion needed
            hour: ssDate.time?.hour || 0,
            minute: ssDate.time?.minute || 0,
            second: ssDate.time?.second || 0,
            dayOffset: 0,
            sunrise: sunriseSunset.sunrise,
            sunset: sunriseSunset.sunset,
            display: {
                date: formattedDate,
                time: formattedTime,
                weekday: safeWeekdayName,
                day: ssDate.day.toString(),
                monthName: safeMonthName,
                month: ssDate.month.toString(),
                year: ssDate.year.toString(),
                daySuffix: this.getOrdinalSuffix(ssDate.day),
                yearPrefix: yearPrefix,
                yearPostfix: yearSuffix
            },
            weekdays: weekdayNames,
            showWeekdayHeadings: true,
            currentSeason: {
                icon: seasonInfo.icon
            }
        };
    }
    timestampPlusInterval(timestamp, interval) {
        if (!interval)
            return timestamp;
        try {
            if (!this.seasonsStars?.api) {
                // Fallback to simple arithmetic when S&S not available
                let newTimestamp = timestamp;
                if (interval.year)
                    newTimestamp += interval.year * 365 * 86400;
                if (interval.month)
                    newTimestamp += interval.month * 30 * 86400;
                if (interval.day)
                    newTimestamp += interval.day * 86400;
                if (interval.hour)
                    newTimestamp += interval.hour * 3600;
                if (interval.minute)
                    newTimestamp += interval.minute * 60;
                if (interval.second)
                    newTimestamp += interval.second;
                return newTimestamp;
            }
            // Use S&S API for proper calendar-aware interval calculation
            const currentDate = this.seasonsStars.api.worldTimeToDate(timestamp);
            let newTimestamp = timestamp;
            // For complex intervals, convert to date, modify, and convert back
            if (interval.year || interval.month) {
                const modifiedDate = { ...currentDate };
                if (interval.year)
                    modifiedDate.year += interval.year;
                if (interval.month) {
                    modifiedDate.month += interval.month;
                    // Handle month overflow
                    while (modifiedDate.month > 12) {
                        modifiedDate.month -= 12;
                        modifiedDate.year += 1;
                    }
                    while (modifiedDate.month < 1) {
                        modifiedDate.month += 12;
                        modifiedDate.year -= 1;
                    }
                }
                newTimestamp = this.seasonsStars.api.dateToWorldTime(modifiedDate);
            }
            // Apply time-based intervals directly to timestamp
            if (interval.day)
                newTimestamp += interval.day * 86400;
            if (interval.hour)
                newTimestamp += interval.hour * 3600;
            if (interval.minute)
                newTimestamp += interval.minute * 60;
            if (interval.second)
                newTimestamp += interval.second;
            return newTimestamp;
        }
        catch (error) {
            console.warn('Failed to add interval to timestamp:', error);
            return timestamp;
        }
    }
    getCurrentDate() {
        try {
            if (!this.seasonsStars?.api) {
                const currentTimestamp = this.timestamp();
                return this.createFallbackDate(currentTimestamp);
            }
            // Use S&S API to get current date
            const ssDate = this.seasonsStars.api.getCurrentDate();
            return this.convertSSToSCFormat(ssDate);
        }
        catch (error) {
            console.error('Failed to get current date:', error);
            const currentTimestamp = this.timestamp();
            return this.createFallbackDate(currentTimestamp);
        }
    }
    formatDateTime(date, format) {
        try {
            if (!this.seasonsStars?.api) {
                return '';
            }
            // Convert Simple Calendar format back to S&S CalendarDate format
            const ssDate = this.convertSCToSSFormat(date);
            // Use S&S API to format the date
            return this.seasonsStars.api.formatDate(ssDate);
        }
        catch (error) {
            console.warn('Failed to format date:', error);
            return '';
        }
    }
    dateToTimestamp(date) {
        try {
            if (!this.seasonsStars?.api) {
                return 0;
            }
            // Convert Simple Calendar format to S&S CalendarDate format
            const ssDate = this.convertSCToSSFormat(date);
            // Use S&S API to convert date to timestamp
            return this.seasonsStars.api.dateToWorldTime(ssDate);
        }
        catch (error) {
            console.warn('Failed to convert date to timestamp:', error);
            return 0;
        }
    }
    /**
     * Convert Simple Calendar format to S&S CalendarDate format
     * CRITICAL: Simple Calendar uses 0-based months/days, S&S uses 1-based
     */
    convertSCToSSFormat(scDate) {
        return {
            year: scDate.year,
            month: (scDate.month || 0) + 1, // Convert 0-based to 1-based
            day: (scDate.day || 0) + 1, // Convert 0-based to 1-based
            weekday: (scDate.dayOfTheWeek || scDate.weekday || 0), // Already 0-based, no conversion needed
            time: {
                hour: scDate.hour || 0,
                minute: scDate.minute || 0,
                second: scDate.second || scDate.seconds || 0
            }
        };
    }
    // Time advancement methods
    async advanceDays(days) {
        if (!this.seasonsStars?.api?.advanceDays) {
            throw new Error('Time advancement not supported by Seasons & Stars');
        }
        await this.seasonsStars.api.advanceDays(days);
    }
    async advanceHours(hours) {
        if (!this.seasonsStars?.api?.advanceHours) {
            throw new Error('Hour advancement not supported by Seasons & Stars');
        }
        await this.seasonsStars.api.advanceHours(hours);
    }
    async advanceMinutes(minutes) {
        if (!this.seasonsStars?.api?.advanceMinutes) {
            throw new Error('Minute advancement not supported by Seasons & Stars');
        }
        await this.seasonsStars.api.advanceMinutes(minutes);
    }
    // Legacy support methods
    addMonths(date, months) {
        const timestamp = this.dateToTimestamp(date);
        const newTimestamp = this.timestampPlusInterval(timestamp, { month: months });
        return this.timestampToDate(newTimestamp);
    }
    addYears(date, years) {
        const timestamp = this.dateToTimestamp(date);
        const newTimestamp = this.timestampPlusInterval(timestamp, { year: years });
        return this.timestampToDate(newTimestamp);
    }
    async setTime(time) {
        if (game.user?.isGM) {
            const currentTime = game.time?.worldTime || 0;
            await game.time?.advance(time - currentTime);
        }
        else {
            throw new Error('Only GMs can set world time');
        }
    }
    // Simple Weather specific APIs
    /**
     * Add sidebar button to calendar widgets
     *
     * Primary integration point for Simple Weather module. Adds buttons to all
     * available S&S calendar widgets (mini, main, grid) with fallback to DOM
     * manipulation when S&S APIs are unavailable.
     *
     * @param name - Unique button identifier
     * @param icon - FontAwesome icon class (e.g., 'fas fa-cloud')
     * @param tooltip - Button tooltip text
     * @param isToggle - Whether button should toggle (legacy parameter, not used)
     * @param callback - Function to call when button is clicked
     *
     * @example
     * ```typescript
     * SimpleCalendar.api.addSidebarButton(
     *   'weather',
     *   'fas fa-cloud',
     *   'Toggle Weather Display',
     *   false,
     *   () => toggleWeatherPanel()
     * );
     * ```
     */
    addSidebarButton(name, icon, tooltip, isToggle, callback) {
        console.log(`🌉 Simple Calendar Bridge: addSidebarButton called with:`, {
            name, icon, tooltip, isToggle,
            callbackType: typeof callback
        });
        this.sidebarButtons.push({ name, icon, callback, tooltip, isToggle });
        console.log(`Simple Calendar Bridge: Sidebar button "${name}" registered (tooltip: ${tooltip}, toggle: ${isToggle})`);
        // Add the button to existing Seasons & Stars widgets using S&S API
        this.addButtonToWidgets(name, icon, tooltip, callback);
    }
    /**
     * Add a button to existing Seasons & Stars widgets using S&S Integration API
     */
    addButtonToWidgets(name, icon, tooltip, callback) {
        console.log(`🌟 Adding weather button "${name}" to S&S widgets via Integration API`);
        if (!this.seasonsStars?.widgets) {
            console.warn('🌟 S&S widgets interface not available, falling back to DOM manipulation');
            this.addButtonToWidgetsViaDOM(name, icon, tooltip, callback);
            return;
        }
        try {
            // Try to add button to mini widget first (preferred for Simple Weather)
            const miniWidget = this.seasonsStars.widgets.mini;
            if (miniWidget) {
                // Ensure Simple Calendar compatibility DOM structure first
                this.addSimpleCalendarCompatibility(miniWidget);
                // Check if button already exists to avoid duplicates
                if (!miniWidget.hasSidebarButton(name)) {
                    miniWidget.addSidebarButton(name, icon, tooltip, callback);
                    console.log(`🌟 Successfully added "${name}" button to mini widget via S&S API`);
                }
                else {
                    console.log(`🌟 Button "${name}" already exists on mini widget`);
                }
            }
            // Also try main widget for consistency
            const mainWidget = this.seasonsStars.widgets.main;
            if (mainWidget) {
                // Ensure Simple Calendar compatibility DOM structure first
                this.addSimpleCalendarCompatibility(mainWidget);
                if (!mainWidget.hasSidebarButton(name)) {
                    mainWidget.addSidebarButton(name, icon, tooltip, callback);
                    console.log(`🌟 Successfully added "${name}" button to main widget via S&S API`);
                }
                else {
                    console.log(`🌟 Button "${name}" already exists on main widget`);
                }
            }
            // Also try grid widget if available
            const gridWidget = this.seasonsStars.widgets.grid;
            if (gridWidget) {
                // Ensure Simple Calendar compatibility DOM structure first
                this.addSimpleCalendarCompatibility(gridWidget);
                if (!gridWidget.hasSidebarButton(name)) {
                    gridWidget.addSidebarButton(name, icon, tooltip, callback);
                    console.log(`🌟 Successfully added "${name}" button to grid widget via S&S API`);
                }
                else {
                    console.log(`🌟 Button "${name}" already exists on grid widget`);
                }
            }
            if (!miniWidget && !mainWidget && !gridWidget) {
                console.warn('🌟 No S&S widgets available, falling back to DOM manipulation');
                this.addButtonToWidgetsViaDOM(name, icon, tooltip, callback);
            }
        }
        catch (error) {
            console.error(`🌟 Failed to add button via S&S API:`, error);
            console.log(`🌟 Falling back to DOM manipulation for button "${name}"`);
            this.addButtonToWidgetsViaDOM(name, icon, tooltip, callback);
        }
    }
    /**
     * Add Simple Calendar compatibility DOM structure and CSS classes to S&S widgets
     * This ensures Simple Weather and other SC-dependent modules can find required elements
     */
    addSimpleCalendarCompatibility(widget) {
        try {
            const widgetInstance = widget.getInstance();
            if (!widgetInstance?.element) {
                console.warn('🌉 Cannot add SC compatibility: widget element not available');
                return;
            }
            const $widget = $(widgetInstance.element);
            // Check if already processed to avoid duplicate work
            if ($widget.hasClass('simple-calendar-compat-processed')) {
                return;
            }
            console.log('🌉 Adding Simple Calendar compatibility DOM structure to widget');
            // Add required Simple Calendar CSS classes and ID
            $widget.attr('id', 'fsc-if');
            $widget.addClass('fsc-if simple-calendar-compat-processed');
            // Ensure .window-content wrapper exists (required for Simple Weather)
            let $windowContent = $widget.find('.window-content');
            if (!$windowContent.length) {
                // Wrap existing content in window-content div
                $widget.wrapInner('<div class="window-content"></div>');
                $windowContent = $widget.find('.window-content');
            }
            // Add Simple Calendar tab structure required for Simple Weather positioning
            let $tabWrapper = $windowContent.find('.fsc-of');
            if (!$tabWrapper.length) {
                $tabWrapper = $(`
          <div class="fsc-of fsc-d" style="display: none; flex-direction: column; position: relative;">
            <!-- Simple Weather positioning anchor - ensures proper attachment -->
            <div class="sc-right" style="margin-left: auto; position: relative;">
              <!-- Container for Simple Weather attached mode -->
              <div id="swr-fsc-container" style="position: relative; z-index: 100; max-width: 300px; margin-top: 8px;">
                <!-- Simple Weather will inject its content here -->
              </div>
            </div>
          </div>
        `);
                $windowContent.append($tabWrapper);
            }
            // Add extended tab state toggle function (required by Simple Weather)
            if (!$widget.data('sc-toggle-attached')) {
                $widget.data('sc-toggle-attached', true);
                // Add global function for Simple Weather to toggle tab state
                window.toggleExtendedCalendar = function () {
                    const $tabPanel = $widget.find('.fsc-of');
                    if ($tabPanel.hasClass('fsc-d')) {
                        // Open tab
                        $tabPanel.removeClass('fsc-d').addClass('fsc-c');
                        $tabPanel.css('display', 'flex');
                        console.log('🌉 Simple Calendar compatibility: Extended calendar opened');
                    }
                    else {
                        // Close tab  
                        $tabPanel.removeClass('fsc-c').addClass('fsc-d');
                        $tabPanel.css('display', 'none');
                        console.log('🌉 Simple Calendar compatibility: Extended calendar closed');
                    }
                };
            }
            console.log('🌉 Simple Calendar compatibility DOM structure added successfully');
        }
        catch (error) {
            console.error('🌉 Failed to add Simple Calendar compatibility:', error);
        }
    }
    /**
     * Fallback method: Add button via DOM manipulation (may be cleared on re-render)
     */
    addButtonToWidgetsViaDOM(name, icon, tooltip, callback) {
        // Find all calendar widgets
        const calendarWidgets = document.querySelectorAll('.calendar-widget, .calendar-mini-widget');
        console.log(`🌟 Found ${calendarWidgets.length} calendar widgets for DOM manipulation`);
        calendarWidgets.forEach((widget) => {
            const $widget = $(widget);
            const buttonId = `simple-weather-button-${name.toLowerCase().replace(/\s+/g, '-')}`;
            console.log(`🌟 Processing widget via DOM:`, widget.className);
            // Add Simple Calendar compatibility DOM structure for fallback mode
            this.addSimpleCalendarCompatibilityViaDOM($widget);
            // Don't add if already exists
            if ($widget.find(`#${buttonId}`).length > 0) {
                console.log(`🌟 Button already exists on widget`);
                return;
            }
            // For calendar widgets, look for the header controls area
            let $targetLocation;
            if ($widget.hasClass('calendar-widget')) {
                // For full calendar widget, add to header controls
                $targetLocation = $widget.find('.window-header .window-controls');
                if (!$targetLocation.length) {
                    $targetLocation = $widget.find('.calendar-header');
                }
            }
            else if ($widget.hasClass('calendar-mini-widget')) {
                // For mini widget, add to the mini header or create one
                $targetLocation = $widget.find('.mini-calendar-header');
                if (!$targetLocation.length) {
                    // Create a header area in the mini widget
                    $targetLocation = $('<div class="mini-calendar-header" style="display: flex; justify-content: flex-end; padding: 4px;"></div>');
                    $widget.prepend($targetLocation);
                }
            }
            if (!$targetLocation || !$targetLocation.length) {
                console.log(`🌟 No suitable location found for button on widget, trying widget itself`);
                // Fallback: add to widget directly
                $targetLocation = $widget;
            }
            // Create the button with better styling
            const $button = $(`
        <div id="${buttonId}" class="simple-weather-button" style="cursor: pointer; padding: 4px 8px; margin: 2px; display: inline-flex; align-items: center; background: var(--color-bg-btn, #f0f0f0); border: 1px solid var(--color-border-dark, #999); border-radius: 3px; color: var(--color-text-primary, #000);" data-tooltip="${tooltip}" title="${tooltip}">
          <i class="fas ${icon}" style="font-size: 14px;"></i>
        </div>
      `);
            // Add click handler with error handling
            $button.on('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                console.log(`🌟 Weather button "${name}" clicked`);
                try {
                    callback();
                    console.log(`🌟 Weather button "${name}" callback executed successfully`);
                }
                catch (error) {
                    console.error(`🌟 Error in weather button callback:`, error);
                }
            });
            // Add hover effects
            $button.on('mouseenter', function () {
                $(this).css('background', 'var(--color-bg-btn-hover, #e0e0e0)');
            }).on('mouseleave', function () {
                $(this).css('background', 'var(--color-bg-btn, #f0f0f0)');
            });
            // Add to target location
            $targetLocation.append($button);
            console.log(`🌟 Added "${name}" button to widget successfully via DOM`);
        });
    }
    /**
     * Add Simple Calendar compatibility DOM structure via direct DOM manipulation
     * Used when S&S widget API is not available
     */
    addSimpleCalendarCompatibilityViaDOM($widget) {
        try {
            // Check if already processed to avoid duplicate work
            if ($widget.hasClass('simple-calendar-compat-processed')) {
                return;
            }
            console.log('🌉 Adding Simple Calendar compatibility DOM structure via DOM manipulation');
            // Add required Simple Calendar CSS classes and ID
            $widget.attr('id', 'fsc-if');
            $widget.addClass('fsc-if simple-calendar-compat-processed');
            // Ensure .window-content wrapper exists (required for Simple Weather)
            let $windowContent = $widget.find('.window-content');
            if (!$windowContent.length) {
                // Wrap existing content in window-content div
                $widget.wrapInner('<div class="window-content"></div>');
                $windowContent = $widget.find('.window-content');
            }
            // Add Simple Calendar tab structure required for Simple Weather positioning
            let $tabWrapper = $windowContent.find('.fsc-of');
            if (!$tabWrapper.length) {
                $tabWrapper = $(`
          <div class="fsc-of fsc-d" style="display: none; flex-direction: column; position: relative;">
            <!-- Simple Weather positioning anchor - ensures proper attachment -->
            <div class="sc-right" style="margin-left: auto; position: relative;">
              <!-- Container for Simple Weather attached mode -->
              <div id="swr-fsc-container" style="position: relative; z-index: 100; max-width: 300px; margin-top: 8px;">
                <!-- Simple Weather will inject its content here -->
              </div>
            </div>
          </div>
        `);
                $windowContent.append($tabWrapper);
            }
            // Add extended tab state toggle function (required by Simple Weather)
            if (!$widget.data('sc-toggle-attached')) {
                $widget.data('sc-toggle-attached', true);
                // Add global function for Simple Weather to toggle tab state
                window.toggleExtendedCalendar = function () {
                    const $tabPanel = $widget.find('.fsc-of');
                    if ($tabPanel.hasClass('fsc-d')) {
                        // Open tab
                        $tabPanel.removeClass('fsc-d').addClass('fsc-c');
                        $tabPanel.css('display', 'flex');
                        console.log('🌉 Simple Calendar compatibility: Extended calendar opened');
                    }
                    else {
                        // Close tab  
                        $tabPanel.removeClass('fsc-c').addClass('fsc-d');
                        $tabPanel.css('display', 'none');
                        console.log('🌉 Simple Calendar compatibility: Extended calendar closed');
                    }
                };
            }
            console.log('🌉 Simple Calendar compatibility DOM structure added via DOM manipulation');
        }
        catch (error) {
            console.error('🌉 Failed to add Simple Calendar compatibility via DOM:', error);
        }
    }
    // Note management APIs (Enhanced for Simple Weather compatibility)
    /**
     * Get all calendar notes for a specific day
     *
     * Critical for Simple Weather: Must return JournalEntry documents that can accept flags
     * Simple Weather stores weather data in flags: `simple-weather.dailyWeather`
     *
     * @param year - Year (Simple Calendar format)
     * @param month - Month (0-based, Simple Calendar format)
     * @param day - Day (0-based, Simple Calendar format)
     * @returns Array of JournalEntry documents for that date
     */
    getNotesForDay(year, month, day) {
        if (!game.journal)
            return [];
        try {
            // Convert 0-based Simple Calendar format to 1-based for storage key
            const storageKey = `${year}-${month + 1}-${day + 1}`;
            console.log(`🌉 Simple Calendar Bridge: getNotesForDay(${year}, ${month}, ${day}) -> storage key: ${storageKey}`);
            // Find all journal entries with S&S calendar note flags for this date
            const calendarNotes = game.journal.filter((journal) => {
                const noteFlags = journal.flags?.['seasons-and-stars'];
                if (!noteFlags?.calendarNote)
                    return false;
                // Check if this note is for the requested date
                if (noteFlags.dateKey === storageKey) {
                    console.log(`🌉 Simple Calendar Bridge: Found note for ${storageKey}:`, journal.name);
                    return true;
                }
                // Legacy compatibility: check old startDate format (for bridge-created notes)
                if (noteFlags.startDate) {
                    const startDate = noteFlags.startDate;
                    // Note: S&S uses 1-based dates, but we're comparing with 0-based month/day from Simple Calendar API
                    if (startDate.year === year && (startDate.month - 1) === month && (startDate.day - 1) === day) {
                        console.log(`🌉 Simple Calendar Bridge: Found S&S note for ${storageKey}:`, journal.name);
                        return true;
                    }
                }
                return false;
            });
            console.log(`🌉 Simple Calendar Bridge: Found ${calendarNotes.length} note(s) for date ${storageKey}`);
            return calendarNotes;
        }
        catch (error) {
            console.error('🌉 Simple Calendar Bridge: Error in getNotesForDay:', error);
            return [];
        }
    }
    /**
     * Add a calendar note
     *
     * Critical for Simple Weather: Must return a JournalEntry that supports setFlag()
     * Simple Weather calls: newNote?.setFlag(moduleJson.id, SC_NOTE_WEATHER_FLAG_NAME, weatherData)
     *
     * @param title - Note title
     * @param content - Note content
     * @param startDate - Start date (Simple Calendar format with 0-based month/day)
     * @param endDate - End date (Simple Calendar format)
     * @param allDay - Whether note is all-day
     * @returns Promise<JournalEntry> that supports flag operations
     */
    async addNote(title, content, startDate, endDate, allDay) {
        if (!game.user?.isGM) {
            console.warn('🌉 Simple Calendar Bridge: Only GMs can create calendar notes');
            return null;
        }
        try {
            console.log('🌉 Simple Calendar Bridge: Creating calendar note:', {
                title, content, startDate, endDate, allDay
            });
            // Create storage key for date-based retrieval (convert 0-based to 1-based)
            const dateKey = `${startDate.year}-${(startDate.month || 0) + 1}-${(startDate.day || 0) + 1}`;
            // Get or create the calendar notes folder
            const noteFolder = await this.getOrCreateNotesFolder();
            const journal = await JournalEntry.create({
                name: title,
                folder: noteFolder.id,
                flags: {
                    // Create S&S-compatible notes only - S&S storage will index these properly
                    'seasons-and-stars': {
                        calendarNote: true,
                        version: '1.0',
                        dateKey: dateKey,
                        startDate: {
                            year: (startDate.year || 0),
                            month: (startDate.month || 0) + 1, // Convert back to 1-based for S&S
                            day: (startDate.day || 0) + 1, // Convert back to 1-based for S&S
                            hour: startDate.hour || 0,
                            minute: startDate.minute || 0,
                            second: startDate.second || 0
                        },
                        endDate: endDate ? {
                            year: (endDate.year || 0),
                            month: (endDate.month || 0) + 1, // Convert back to 1-based for S&S
                            day: (endDate.day || 0) + 1, // Convert back to 1-based for S&S
                            hour: endDate.hour || 0,
                            minute: endDate.minute || 0,
                            second: endDate.second || 0
                        } : undefined,
                        allDay: allDay,
                        calendarId: 'seasons-and-stars', // Use default S&S calendar
                        category: 'general', // Default category
                        tags: [],
                        created: Date.now(),
                        modified: Date.now()
                    },
                    // Optional: Bridge tracking flags for internal use (separate from S&S)
                    'foundryvtt-simple-calendar-compat': {
                        bridgeCreated: true,
                        originalFormat: {
                            startDate: startDate,
                            endDate: endDate
                        },
                        created: Date.now()
                    }
                }
            });
            if (!journal) {
                throw new Error('Failed to create journal entry');
            }
            // Create content page using v13 pages system - match Simple Calendar's "Details" page name
            await journal.createEmbeddedDocuments("JournalEntryPage", [{
                    type: 'text',
                    name: 'Details', // Always use "Details" like original Simple Calendar
                    text: {
                        content: content || '',
                        format: 1 // CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML
                    }
                }]);
            console.log('🌉 Simple Calendar Bridge: Created calendar note:', journal.name, 'with dateKey:', dateKey);
            // Force S&S storage system to rebuild its index to include new notes
            // This uses S&S's existing public API without making S&S aware of the bridge
            if (game.seasonsStars?.notes?.storage) {
                game.seasonsStars.notes.storage.rebuildIndex();
                console.log('🌉 Simple Calendar Bridge: Triggered S&S storage reindex');
            }
            return journal;
        }
        catch (error) {
            console.error('🌉 Simple Calendar Bridge: Failed to create calendar note:', error);
            return null;
        }
    }
    /**
     * Remove a calendar note by ID
     *
     * @param noteId - JournalEntry document ID
     */
    async removeNote(noteId) {
        if (!game.user?.isGM) {
            console.warn('🌉 Simple Calendar Bridge: Only GMs can remove calendar notes');
            return;
        }
        try {
            const journal = game.journal?.get(noteId);
            if (journal) {
                console.log('🌉 Simple Calendar Bridge: Removing calendar note:', journal.name);
                await journal.delete();
                console.log('🌉 Simple Calendar Bridge: Note removed successfully');
            }
            else {
                console.warn('🌉 Simple Calendar Bridge: Note not found for removal:', noteId);
            }
        }
        catch (error) {
            console.error('🌉 Simple Calendar Bridge: Failed to remove calendar note:', error);
        }
    }
    // Clock control APIs for SmallTime integration
    clockStatus() {
        return { started: this.clockRunning };
    }
    startClock() {
        this.clockRunning = true;
        Hooks.callAll('simple-calendar-clock-start-stop', { started: true });
    }
    stopClock() {
        this.clockRunning = false;
        Hooks.callAll('simple-calendar-clock-start-stop', { started: false });
    }
    showCalendar() {
        // Could trigger calendar widget display if available
        console.log('Simple Calendar Bridge: Calendar display requested');
    }
    // Additional APIs for module compatibility
    getAllMoons() {
        return [{
                color: '#ffffff',
                currentPhase: { icon: 'new' }
            }];
    }
    getAllSeasons() {
        return [
            { name: 'Spring', icon: 'spring' },
            { name: 'Summer', icon: 'summer' },
            { name: 'Fall', icon: 'fall' },
            { name: 'Winter', icon: 'winter' }
        ];
    }
    // Utility methods
    getOrdinalSuffix(day) {
        if (day >= 11 && day <= 13) {
            return 'th';
        }
        const lastDigit = day % 10;
        switch (lastDigit) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }
    createFallbackDate(timestamp) {
        const days = Math.floor(timestamp / 86400);
        const secondsInDay = timestamp % 86400;
        const hour = Math.floor(secondsInDay / 3600);
        const minute = Math.floor((secondsInDay % 3600) / 60);
        const second = secondsInDay % 60;
        return {
            year: 2023,
            month: 0, // 0-based January
            day: days,
            dayOfTheWeek: 0,
            hour,
            minute,
            second,
            dayOffset: 0,
            sunrise: days * 86400 + (6 * 3600), // 6 AM
            sunset: days * 86400 + (18 * 3600), // 6 PM
            display: {
                date: `2023-01-${(days + 1).toString().padStart(2, '0')}`,
                time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
                weekday: 'Sunday',
                day: (days + 1).toString(),
                monthName: 'January',
                month: '1',
                year: '2023',
                daySuffix: this.getOrdinalSuffix(days + 1),
                yearPrefix: '',
                yearPostfix: ''
            },
            weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            showWeekdayHeadings: true,
            currentSeason: {
                icon: 'winter'
            }
        };
    }
    /**
     * Get or create the calendar notes folder
     */
    async getOrCreateNotesFolder() {
        // Try to find existing folder - check BOTH flag types to prevent duplicates
        const existingFolder = game.folders?.find((f) => f.type === 'JournalEntry' && (
        // Check for bridge flags
        f.getFlag?.('foundryvtt-simple-calendar-compat', 'notesFolder') === true ||
            // Check for S&S flags (in case S&S created the folder first)
            f.getFlag?.('seasons-and-stars', 'notesFolder') === true));
        if (existingFolder) {
            // If found S&S folder, add bridge flag for future detection
            if (!existingFolder.getFlag('foundryvtt-simple-calendar-compat', 'notesFolder')) {
                await existingFolder.setFlag('foundryvtt-simple-calendar-compat', 'notesFolder', true);
                console.log('🌉 Simple Calendar Bridge: Added bridge flag to existing S&S notes folder');
            }
            return existingFolder;
        }
        // Create new folder with BOTH flag types for compatibility
        const folder = await globalThis.Folder.create({
            name: 'Calendar Notes',
            type: 'JournalEntry',
            flags: {
                'foundryvtt-simple-calendar-compat': {
                    notesFolder: true,
                    version: '1.0'
                },
                'seasons-and-stars': {
                    notesFolder: true,
                    version: '1.0'
                }
            }
        });
        if (!folder) {
            throw new Error('Failed to create notes folder');
        }
        console.log('🌉 Simple Calendar Bridge: Created Calendar Notes folder with unified flags');
        return folder;
    }
}

/**
 * Hook bridging system for Simple Calendar compatibility
 */
class HookBridge {
    provider;
    clockRunning = false;
    // Simple Calendar hook names
    SIMPLE_CALENDAR_HOOKS = {
        Init: 'simple-calendar-init',
        DateTimeChange: 'simple-calendar-date-time-change',
        ClockStartStop: 'simple-calendar-clock-start-stop'
    };
    constructor(provider) {
        this.provider = provider;
    }
    /**
     * Initialize hook bridging between provider and Simple Calendar format
     */
    initialize() {
        console.log(`Simple Calendar Bridge: Setting up hook bridging for ${this.provider.name}`);
        // Listen for provider-specific hooks and translate to Simple Calendar format
        this.setupProviderHooks();
        // Set up Foundry core hooks
        this.setupFoundryHooks();
        // Emit the initialization hook that modules listen for
        console.log('🌉 Simple Calendar Bridge: About to emit Init hook');
        console.log('🌉 Simple Calendar Bridge: Hook name:', this.SIMPLE_CALENDAR_HOOKS.Init);
        console.log('🌉 Simple Calendar Bridge: Registered listeners before Init:', Hooks._hooks?.[this.SIMPLE_CALENDAR_HOOKS.Init]?.length || 0);
        Hooks.callAll(this.SIMPLE_CALENDAR_HOOKS.Init);
        console.log('🌉 Simple Calendar Bridge: Init hook emitted');
        console.log('🌉 Simple Calendar Bridge: renderMainApp listeners after Init:', Hooks._hooks?.['renderMainApp']?.length || 0);
    }
    /**
     * Set up provider-specific hook listeners
     */
    setupProviderHooks() {
        // Seasons & Stars specific hooks
        if (this.provider.name === 'Seasons & Stars') {
            Hooks.on('seasons-stars:dateChanged', this.onDateChanged.bind(this));
            Hooks.on('seasons-stars:calendarChanged', this.onCalendarChanged.bind(this));
        }
        // About Time specific hooks (future)
        // if (this.provider.name === 'About Time') {
        //   Hooks.on('about-time:timeChanged', this.onDateChanged.bind(this));
        // }
    }
    /**
     * Set up Foundry core hook listeners
     */
    setupFoundryHooks() {
        // Listen to core world time updates
        Hooks.on('updateWorldTime', this.onWorldTimeUpdate.bind(this));
        // Listen for setting changes that might affect calendar
        Hooks.on('updateSetting', this.onSettingUpdate.bind(this));
    }
    /**
     * Handle date/time changes from the provider
     */
    onDateChanged() {
        try {
            const currentDate = this.getCurrentSimpleCalendarDate();
            Hooks.callAll(this.SIMPLE_CALENDAR_HOOKS.DateTimeChange, {
                date: currentDate,
                moons: this.getAllMoons(),
                seasons: this.getAllSeasons()
            });
            console.log('Simple Calendar Bridge: Date change hook emitted');
        }
        catch (error) {
            console.warn('Failed to emit date change hook:', error);
        }
    }
    /**
     * Handle calendar changes (switching between different calendars)
     */
    onCalendarChanged() {
        // Re-emit date change with new calendar context
        this.onDateChanged();
    }
    /**
     * Handle Foundry core world time updates
     */
    onWorldTimeUpdate() {
        // Emit Simple Calendar date change when Foundry time updates
        this.onDateChanged();
    }
    /**
     * Handle setting updates that might affect calendar display
     */
    onSettingUpdate(setting) {
        // Check if it's a calendar-related setting
        if (setting?.key?.includes('calendar') || setting?.key?.includes('time')) {
            this.onDateChanged();
        }
    }
    /**
     * Clock control methods
     */
    startClock() {
        this.clockRunning = true;
        Hooks.callAll(this.SIMPLE_CALENDAR_HOOKS.ClockStartStop, { started: true });
    }
    stopClock() {
        this.clockRunning = false;
        Hooks.callAll(this.SIMPLE_CALENDAR_HOOKS.ClockStartStop, { started: false });
    }
    getClockStatus() {
        return { started: this.clockRunning };
    }
    /**
     * Get current date in Simple Calendar format
     */
    getCurrentSimpleCalendarDate() {
        try {
            const currentDate = this.provider.getCurrentDate();
            if (!currentDate)
                return null;
            const monthNames = this.provider.getMonthNames();
            const weekdayNames = this.provider.getWeekdayNames();
            const sunriseSunset = this.provider.getSunriseSunset?.(currentDate) || { sunrise: 0, sunset: 0 };
            const seasonInfo = this.provider.getSeasonInfo?.(currentDate) || { icon: 'none', name: 'Unknown' };
            return {
                year: currentDate.year,
                month: currentDate.month - 1, // 0-based for SC compatibility
                day: currentDate.day - 1, // 0-based for SC compatibility
                dayOfTheWeek: currentDate.weekday - 1, // 0-based for SC compatibility
                hour: currentDate.time?.hour || 0,
                minute: currentDate.time?.minute || 0,
                second: currentDate.time?.second || 0,
                sunrise: sunriseSunset.sunrise,
                sunset: sunriseSunset.sunset,
                display: {
                    monthName: monthNames[currentDate.month - 1] || '',
                    weekday: weekdayNames[currentDate.weekday] || '',
                    // ... other display properties
                }
            };
        }
        catch (error) {
            console.warn('Failed to get current Simple Calendar date:', error);
            return null;
        }
    }
    /**
     * Get moon data for compatibility
     */
    getAllMoons() {
        return [{
                color: '#ffffff',
                currentPhase: { icon: 'new' }
            }];
    }
    /**
     * Get season data for compatibility
     */
    getAllSeasons() {
        return [
            { name: 'Spring', icon: 'spring' },
            { name: 'Summer', icon: 'summer' },
            { name: 'Fall', icon: 'fall' },
            { name: 'Winter', icon: 'winter' }
        ];
    }
    /**
     * Get the Simple Calendar hook constants for external access
     */
    getHookNames() {
        return this.SIMPLE_CALENDAR_HOOKS;
    }
}

/**
 * Simple Calendar Compatibility Bridge
 * Provides Simple Calendar API compatibility for modern calendar modules
 */
/**
 * CRITICAL: Expose SimpleCalendar immediately at module parse time
 * Simple Weather checks for 'SimpleCalendar' in globalThis when its module script loads
 * This must happen before any hooks, at the top level of our module
 */
console.log('🌉 Simple Calendar Compatibility Bridge | Exposing SimpleCalendar at module parse time');
// Create a minimal SimpleCalendar object that Simple Weather can detect
const moduleParseTimeSimpleCalendar = {
    api: {
        timestampToDate: () => ({ display: { monthName: '', day: '1', year: '2024' } }),
        getCurrentDate: () => ({ display: { monthName: '', day: '1', year: '2024' } })
    },
    Hooks: {
        DateTimeChange: 'simple-calendar-date-time-change',
        Init: 'simple-calendar-init',
        ClockStartStop: 'simple-calendar-clock-start-stop'
    }
};
// Expose globally immediately - this happens when the module script is parsed
window.SimpleCalendar = moduleParseTimeSimpleCalendar;
globalThis.SimpleCalendar = moduleParseTimeSimpleCalendar;
console.log('🌉 Simple Calendar Compatibility Bridge | SimpleCalendar exposed at parse time - Simple Weather should detect it');
// Add minimal CSS classes that Simple Weather expects for attached mode
const compatCSS = `
  /* Minimal Simple Calendar compatibility classes for Simple Weather attached mode */
  .fsc-of {
    /* Tab wrapper - basic flex container */
    display: flex;
    flex-direction: column;
    position: relative;
  }
  
  .fsc-c {
    /* Tab extended/open state - visible */
    display: block;
  }
  
  .fsc-d {
    /* Tab closed state - hidden */
    display: none;
  }
  
  .sc-right {
    /* Right-aligned positioning - only within attached mode */
    margin-left: auto;
  }
  
  #swr-fsc-container {
    /* Simple Weather attached container */
    position: relative;
    z-index: 100;
    max-width: 300px;
    margin-top: 8px;
  }
  
  /* Only apply these styles when Simple Weather is in attached mode */
  #swr-fsc-container #swr-container {
    /* Simple Weather main container when attached */
    position: relative !important;
    background: var(--color-bg);
    border: 1px solid var(--color-border-dark);
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  
  /* Ensure non-attached mode isn't affected by our CSS */
  #swr-container:not(#swr-fsc-container #swr-container) {
    /* Reset any unwanted styling for non-attached mode */
    margin-left: unset !important;
  }
`;
// Inject the CSS into the document head
const style = document.createElement('style');
style.textContent = compatCSS;
document.head.appendChild(style);
console.log('🌉 Simple Calendar Compatibility Bridge | Minimal CSS classes added for attached mode');
class SimpleCalendarCompatibilityBridge {
    provider = null;
    api = null;
    hookBridge = null;
    /**
     * Initialize the compatibility bridge
     */
    async initialize() {
        console.log('🌉 Simple Calendar Compatibility Bridge | Initializing...');
        // Check if Simple Calendar is already active (but not our fake module)
        const existingModule = game.modules.get('foundryvtt-simple-calendar');
        if (existingModule?.active && existingModule.title !== 'Simple Calendar (Compatibility Bridge)') {
            console.log('🌉 Simple Calendar Compatibility Bridge | Real Simple Calendar is active - bridge not needed');
            return;
        }
        // Detect available calendar providers (for backward compatibility)
        this.provider = this.detectCalendarProvider();
        if (!this.provider) {
            console.warn('🌉 Simple Calendar Compatibility Bridge | No supported calendar module found');
            ui.notifications?.warn(game.i18n.localize('SIMPLE_CALENDAR_COMPAT.PROVIDER_NOT_FOUND'));
            return;
        }
        console.log(`🌉 Simple Calendar Compatibility Bridge | Using provider: ${this.provider.name} v${this.provider.version}`);
        // Create API bridge - detects integration interface internally
        this.api = new SimpleCalendarAPIBridge();
        // Create hook bridge using provider for compatibility
        this.hookBridge = new HookBridge(this.provider);
        // Expose Simple Calendar API
        this.exposeSimpleCalendarAPI();
        // Initialize hook bridging
        this.hookBridge.initialize();
        // Set up integration with Seasons & Stars widgets
        this.setupWidgetIntegration();
        console.log('🌉 Simple Calendar Compatibility Bridge | Ready');
        ui.notifications?.info(game.i18n.localize('SIMPLE_CALENDAR_COMPAT.API_READY'));
    }
    /**
     * Detect available calendar providers in priority order
     */
    detectCalendarProvider() {
        console.log('🌉 Detecting calendar providers...');
        console.log('🌉 Available modules:', Array.from(game.modules?.keys() || []));
        console.log('🌉 game.seasonsStars available:', !!game.seasonsStars);
        // Priority 1: Seasons & Stars Integration Interface (v2.0+)
        if (SeasonsStarsIntegrationProvider.isAvailable()) {
            console.log('🌉 Seasons & Stars integration provider is available');
            return new SeasonsStarsIntegrationProvider();
        }
        // Priority 2: Seasons & Stars Legacy Provider (v1.x)
        if (SeasonsStarsProvider.isAvailable()) {
            console.log('🌉 Seasons & Stars legacy provider is available');
            return new SeasonsStarsProvider();
        }
        else {
            console.log('🌉 No Seasons & Stars providers available');
        }
        // Priority 2: About Time (future implementation)
        // if (AboutTimeProvider.isAvailable()) {
        //   return new AboutTimeProvider();
        // }
        // Priority 3: Other calendar modules (future)
        console.log('🌉 No calendar providers found');
        return null;
    }
    /**
     * Expose the Simple Calendar API to the global scope
     */
    exposeSimpleCalendarAPI() {
        if (!this.api || !this.hookBridge) {
            throw new Error('API or Hook bridge not initialized');
        }
        console.log('🌉 Exposing Simple Calendar API...');
        console.log('🌉 API object:', this.api);
        console.log('🌉 Testing getCurrentDate:', this.api.getCurrentDate());
        console.log('🌉 Testing timestamp:', this.api.timestamp());
        // Replace any temporary SimpleCalendar object with the full bridge
        console.log('🌉 Replacing temporary SimpleCalendar with full bridge');
        // Create the global SimpleCalendar object that modules expect
        // Simple Weather checks for SimpleCalendar in globalThis, not window
        window.SimpleCalendar = {
            api: this.api,
            Hooks: this.hookBridge.getHookNames(),
            Icons: Icons
        };
        // Also expose in globalThis for Simple Weather compatibility
        globalThis.SimpleCalendar = {
            api: this.api,
            Hooks: this.hookBridge.getHookNames(),
            Icons: Icons
        };
        console.log('🌉 SimpleCalendar.api exposed:', !!globalThis.SimpleCalendar?.api);
        console.log('🌉 SimpleCalendar.api.getCurrentDate:', typeof globalThis.SimpleCalendar?.api?.getCurrentDate);
        // Register fake Simple Calendar module for dependency checking
        this.registerFakeSimpleCalendarModule();
        // Also add to game object for easier access
        game.simpleCalendarCompat = {
            provider: this.provider,
            api: this.api,
            version: game.modules.get('foundryvtt-simple-calendar-compat')?.version || '0.1.0'
        };
        console.log('🌉 Simple Calendar Compatibility Bridge | API exposed globally');
    }
    /**
     * Register a fake Simple Calendar module entry for dependency checking
     */
    registerFakeSimpleCalendarModule() {
        // Check if we should register the fake module
        // If Simple Weather is set to detached mode, don't register so it shows its own UI
        const simpleWeatherModule = game.modules.get('foundryvtt-simple-weather');
        if (simpleWeatherModule?.active) {
            const attachedToSC = game.settings?.get('foundryvtt-simple-weather', 'attachToCalendar');
            if (attachedToSC === false) {
                console.log('🌉 Simple Calendar Compatibility Bridge | Simple Weather is in detached mode, skipping fake module registration');
                return;
            }
        }
        // Create a complete module object that satisfies all Foundry systems
        const fakeModule = {
            id: 'foundryvtt-simple-calendar',
            title: 'Simple Calendar (Compatibility Bridge)',
            active: true,
            version: '2.4.18', // Version that Simple Weather expects
            compatibility: {
                minimum: '13',
                verified: '13',
                maximum: '13'
            },
            // Required arrays that Foundry expects
            authors: [{ name: 'Simple Calendar Compatibility Bridge' }],
            esmodules: [],
            styles: [],
            languages: [],
            packs: [],
            scripts: [],
            relationships: {
                requires: [],
                recommends: [],
                conflicts: [],
                systems: [] // Required by ModuleManagement
            },
            // Additional properties from module manifest
            description: 'Compatibility bridge providing Simple Calendar API for modern calendar modules',
            url: '',
            readme: '',
            bugs: '',
            flags: {},
            socket: false,
            // Add toObject method that Foundry's ModuleManagement expects
            toObject: function () {
                return {
                    id: this.id,
                    title: this.title,
                    description: this.description,
                    authors: this.authors,
                    url: this.url,
                    readme: this.readme,
                    bugs: this.bugs,
                    version: this.version,
                    compatibility: this.compatibility,
                    relationships: this.relationships,
                    packs: this.packs,
                    scripts: this.scripts,
                    styles: this.styles,
                    languages: this.languages,
                    esmodules: this.esmodules,
                    flags: this.flags,
                    socket: this.socket
                };
            },
            // Add getVersionBadge method that Foundry's ModuleManagement expects
            getVersionBadge: function () {
                return {
                    type: 'success',
                    tooltip: `Simple Calendar Compatibility Bridge v${this.version}`,
                    label: this.version,
                    icon: 'fa-check'
                };
            }
        };
        // Add to game.modules
        if (game.modules && !game.modules.get('foundryvtt-simple-calendar')) {
            // Use the internal modules collection to register our fake module
            game.modules.set('foundryvtt-simple-calendar', fakeModule);
            console.log('🌉 Simple Calendar Compatibility Bridge | Registered fake Simple Calendar module entry');
        }
    }
    /**
     * Set up integration with Seasons & Stars widgets to support Simple Weather
     */
    setupWidgetIntegration() {
        console.log('🌉 Simple Calendar Compatibility Bridge | Setting up widget integration');
        // Immediately check for existing widgets
        this.integrateWithSeasonsStarsWidgets();
        // Listen for specific widget renders (DOM is ready when this hook fires)
        Hooks.on('renderApplication', (app, html) => {
            if (app.constructor.name === 'CalendarWidget' || app.constructor.name === 'CalendarMiniWidget') {
                // DOM is ready, integrate immediately
                this.integrateWithSpecificWidget(html);
            }
        });
        // Also use MutationObserver for widgets created outside the normal render cycle
        this.setupDOMObserver();
    }
    /**
     * Set up DOM observer to detect new calendar widgets
     */
    setupDOMObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node;
                        if (element.matches?.('.calendar-widget, .calendar-mini-widget') ||
                            element.querySelector?.('.calendar-widget, .calendar-mini-widget')) {
                            // New widget detected, integrate it
                            this.integrateWithSeasonsStarsWidgets();
                        }
                    }
                });
            });
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        // Store for cleanup
        this.domObserver = observer;
    }
    /**
     * Integrate with a specific widget (from renderApplication hook)
     */
    integrateWithSpecificWidget(html) {
        console.log('🌉 Simple Calendar Compatibility Bridge | Integrating with specific widget');
        // Add Simple Calendar CSS classes that Simple Weather expects
        this.addSimpleCalendarCompatibility(html);
        // Create fake app and emit hook
        const fakeApp = {
            constructor: { name: 'SimpleCalendar' },
            id: 'simple-calendar-app',
            element: html[0],
            rendered: true
        };
        // Emit hook immediately - Simple Weather should be ready to handle it
        console.log('🌉 Simple Calendar Compatibility Bridge | Emitting renderMainApp hook for specific widget');
        Hooks.callAll('renderMainApp', fakeApp, html);
        // Add any existing sidebar buttons
        this.addExistingSidebarButtons(html);
    }
    /**
     * Integrate with existing Seasons & Stars widgets to trigger Simple Weather
     */
    integrateWithSeasonsStarsWidgets() {
        // Find Seasons & Stars calendar widgets
        const calendarWidgets = document.querySelectorAll('.calendar-widget, .calendar-mini-widget');
        if (calendarWidgets.length === 0) {
            console.log('🌉 Simple Calendar Compatibility Bridge | No S&S widgets found yet');
            return;
        }
        console.log(`🌉 Simple Calendar Compatibility Bridge | Found ${calendarWidgets.length} S&S widget(s), triggering Simple Weather integration`);
        calendarWidgets.forEach((widget) => {
            const $html = $(widget);
            // Add Simple Calendar compatibility to this widget
            this.addSimpleCalendarCompatibility($html);
            // Create fake app and emit hook for this widget
            const fakeApp = {
                constructor: { name: 'SimpleCalendar' },
                id: 'simple-calendar-app',
                element: widget,
                rendered: true
            };
            // Emit hook immediately - no delay needed
            console.log('🌉 Simple Calendar Compatibility Bridge | Emitting renderMainApp hook');
            console.log('🌉 Simple Calendar Compatibility Bridge | Hook details:', {
                hookName: 'renderMainApp',
                fakeApp: fakeApp,
                widgetElement: widget,
                hasJQuery: !!$html.length
            });
            // Check if Simple Weather has registered listeners for this hook
            const hookListeners = Hooks._hooks?.['renderMainApp'] || [];
            console.log('🌉 Simple Calendar Compatibility Bridge | renderMainApp hook listeners:', hookListeners.length);
            Hooks.callAll('renderMainApp', fakeApp, $html);
            console.log('🌉 Simple Calendar Compatibility Bridge | renderMainApp hook emitted');
            // Add existing sidebar buttons to this widget
            this.addExistingSidebarButtons($html);
        });
    }
    /**
     * Add Simple Calendar CSS classes and structure to a widget
     */
    addSimpleCalendarCompatibility($widget) {
        console.log('🌉 Simple Calendar Compatibility Bridge | Adding compatibility to widget:', $widget.get(0));
        if ($widget.hasClass('simple-calendar-compat')) {
            console.log('🌉 Simple Calendar Compatibility Bridge | Widget already has compatibility structure');
            return; // Already has compatibility structure
        }
        // Add compatibility indicator class
        $widget.addClass('simple-calendar-compat');
        console.log('🌉 Simple Calendar Compatibility Bridge | Added simple-calendar-compat class');
        // Simple Weather expects specific DOM structure for attached mode:
        // - Element with ID 'fsc-if' (SC_ID_FOR_WINDOW_WRAPPER)  
        // - Contains .window-content
        // - Has panels with classes 'fsc-of' (SC_CLASS_FOR_TAB_WRAPPER) and 'fsc-d' (SC_CLASS_FOR_TAB_CLOSED)
        // Add the required ID to the widget for Simple Weather to find
        if (!$widget.attr('id')) {
            $widget.attr('id', 'fsc-if');
            console.log('🌉 Simple Calendar Compatibility Bridge | Added fsc-if ID to widget');
        }
        // Ensure the widget has window-content structure
        let $windowContent = $widget.find('.window-content');
        if (!$windowContent.length) {
            // Find the main content area and wrap it or use the widget itself
            $windowContent = $widget.hasClass('window-content') ? $widget : $widget;
            $windowContent.addClass('window-content');
            console.log('🌉 Simple Calendar Compatibility Bridge | Added window-content class');
        }
        // Add a dummy closed tab panel that Simple Weather can use for positioning
        // This gives Simple Weather a reference point to attach its weather panel
        const dummyPanelId = 'sc-compat-dummy-panel';
        if (!$windowContent.find(`#${dummyPanelId}`).length) {
            const $dummyPanel = $(`
        <div id="${dummyPanelId}" class="fsc-of fsc-d" style="display: none;">
          <!-- Dummy panel for Simple Weather positioning -->
        </div>
      `);
            $windowContent.append($dummyPanel);
            console.log('🌉 Simple Calendar Compatibility Bridge | Added dummy panel for Simple Weather positioning');
        }
        console.log('🌉 Simple Calendar Compatibility Bridge | Compatibility structure added successfully');
    }
    /**
     * Add any existing sidebar buttons to a specific widget
     */
    addExistingSidebarButtons($widget) {
        if (this.api?.sidebarButtons && this.api.sidebarButtons.length > 0) {
            console.log(`🌉 Simple Calendar Compatibility Bridge | Adding ${this.api.sidebarButtons.length} sidebar buttons to widget`);
            this.api.sidebarButtons.forEach((button) => {
                this.addButtonToSpecificWidget($widget, button.name, button.icon, button.tooltip, button.callback);
            });
        }
        else {
            console.log('🌉 Simple Calendar Compatibility Bridge | No sidebar buttons to add');
        }
    }
    /**
     * Add a button to a specific widget using proper widget API when possible
     */
    addButtonToSpecificWidget($widget, name, icon, tooltip, callback) {
        // First try to use Seasons & Stars widget API directly
        if ($widget.hasClass('calendar-widget') && window.SeasonsStars?.CalendarWidget) {
            console.log(`🌉 Simple Calendar Compatibility Bridge | Using Seasons & Stars CalendarWidget API for button "${name}"`);
            try {
                const CalendarWidgetClass = window.SeasonsStars.CalendarWidget;
                const calendarWidget = CalendarWidgetClass.getInstance();
                if (calendarWidget && typeof calendarWidget.addSidebarButton === 'function') {
                    // Check if button already exists to avoid duplicates
                    const existingButton = calendarWidget.sidebarButtons?.find((btn) => btn.name === name);
                    if (existingButton) {
                        console.log(`🌉 Simple Calendar Compatibility Bridge | Button "${name}" already exists in widget's sidebar buttons`);
                        return;
                    }
                    calendarWidget.addSidebarButton(name, icon, tooltip, callback);
                    console.log(`🌉 Simple Calendar Compatibility Bridge | Successfully added "${name}" button via Seasons & Stars widget API`);
                    return;
                }
                else {
                    console.log(`🌉 Simple Calendar Compatibility Bridge | CalendarWidget instance not available or doesn't support addSidebarButton`);
                    console.log(`🌉 Simple Calendar Compatibility Bridge | Instance:`, calendarWidget);
                }
            }
            catch (error) {
                console.warn(`🌉 Simple Calendar Compatibility Bridge | Failed to use Seasons & Stars widget API:`, error);
            }
        }
        // Fall back to DOM manipulation for mini widgets or if API doesn't work
        console.log(`🌉 Simple Calendar Compatibility Bridge | Using DOM manipulation for button "${name}"`);
        this.addButtonToSpecificWidgetViaDOM($widget, name, icon, tooltip, callback);
    }
    /**
     * Fallback method: Add button via DOM manipulation
     */
    addButtonToSpecificWidgetViaDOM($widget, name, icon, tooltip, callback) {
        const buttonId = `simple-weather-button-${name.toLowerCase().replace(/\s+/g, '-')}`;
        // Don't add if already exists
        if ($widget.find(`#${buttonId}`).length > 0) {
            console.log(`🌉 Simple Calendar Compatibility Bridge | Button "${name}" already exists on widget`);
            return;
        }
        console.log(`🌉 Simple Calendar Compatibility Bridge | Adding button "${name}" to widget via DOM`);
        // Look for a good place to add the button
        let $targetLocation;
        if ($widget.hasClass('calendar-widget')) {
            // For full calendar widget, try window-header first
            $targetLocation = $widget.find('.window-header .window-controls');
            if (!$targetLocation.length) {
                $targetLocation = $widget.find('.window-header');
            }
            if (!$targetLocation.length) {
                $targetLocation = $widget.find('.calendar-header');
            }
        }
        else if ($widget.hasClass('calendar-mini-widget')) {
            // For mini widget, add to existing header or create one
            $targetLocation = $widget.find('.mini-calendar-header');
            if (!$targetLocation.length) {
                // Create a header area in the mini widget
                $targetLocation = $('<div class="mini-calendar-header" style="display: flex; justify-content: flex-end; padding: 4px; background: var(--color-bg-option, #f0f0f0); border-bottom: 1px solid var(--color-border-light-tertiary, #ccc);"></div>');
                $widget.prepend($targetLocation);
            }
        }
        if (!$targetLocation || !$targetLocation.length) {
            console.log(`🌉 Simple Calendar Compatibility Bridge | No header found, adding to widget directly`);
            $targetLocation = $widget;
        }
        // Create the button
        const $button = $(`
      <div id="${buttonId}" class="simple-weather-button" style="cursor: pointer; padding: 4px 8px; margin: 2px; display: inline-flex; align-items: center; background: var(--color-bg-btn, #f0f0f0); border: 1px solid var(--color-border-dark, #999); border-radius: 3px; color: var(--color-text-primary, #000);" data-tooltip="${tooltip}" title="${tooltip}">
        <i class="fas ${icon}" style="font-size: 14px;"></i>
      </div>
    `);
        // Add click handler
        $button.on('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            console.log(`🌉 Simple Calendar Compatibility Bridge | Weather button "${name}" clicked`);
            try {
                callback();
                console.log(`🌉 Simple Calendar Compatibility Bridge | Weather button "${name}" callback executed successfully`);
            }
            catch (error) {
                console.error(`🌉 Simple Calendar Compatibility Bridge | Error in weather button callback:`, error);
            }
        });
        // Add hover effects
        $button.on('mouseenter', function () {
            $(this).css('background', 'var(--color-bg-btn-hover, #e0e0e0)');
        }).on('mouseleave', function () {
            $(this).css('background', 'var(--color-bg-btn, #f0f0f0)');
        });
        // Add to target location
        $targetLocation.append($button);
        console.log(`🌉 Simple Calendar Compatibility Bridge | Added "${name}" button to widget successfully via DOM`);
    }
    /**
     * Clean up when module is disabled
     */
    cleanup() {
        if (window.SimpleCalendar) {
            delete window.SimpleCalendar;
        }
        if (globalThis.SimpleCalendar) {
            delete globalThis.SimpleCalendar;
        }
        if (game.simpleCalendarCompat) {
            delete game.simpleCalendarCompat;
        }
        // Clean up DOM observer
        if (this.domObserver) {
            this.domObserver.disconnect();
            delete this.domObserver;
        }
        // Remove fake module registration
        if (game.modules && game.modules.get('foundryvtt-simple-calendar')) {
            game.modules.delete('foundryvtt-simple-calendar');
            console.log('Simple Calendar Compatibility Bridge | Removed fake Simple Calendar module entry');
        }
        console.log('Simple Calendar Compatibility Bridge | Cleaned up');
    }
}
// Module instance
let compatBridge;
/**
 * CRITICAL: Expose SimpleCalendar as early as possible
 * Simple Weather checks for 'SimpleCalendar' in globalThis during its module initialization
 * We need to expose it before Simple Weather's init hook runs
 */
/**
 * Module initialization
 */
Hooks.once('init', () => {
    console.log('🌉 Simple Calendar Compatibility Bridge | Module initializing');
    compatBridge = new SimpleCalendarCompatibilityBridge();
});
/**
 * Setup fake module registration early for dependency checking
 */
Hooks.once('setup', () => {
    console.log('🌉 Simple Calendar Compatibility Bridge | Setup hook firing');
    // Register fake module immediately if Seasons & Stars module is active
    // This prevents Simple Weather from showing errors while we wait for the API
    const seasonsStarsModule = game.modules.get('seasons-and-stars');
    if (seasonsStarsModule?.active && !game.modules.get('foundryvtt-simple-calendar')) {
        console.log('🌉 Simple Calendar Compatibility Bridge | Pre-registering fake SC module for dependency checks');
        compatBridge.registerFakeSimpleCalendarModule();
    }
});
/**
 * Widget integration after all modules are ready
 */
Hooks.once('ready', async () => {
    console.log('🌉 Simple Calendar Compatibility Bridge | Ready hook firing - all modules should have completed setup');
    // Debug Simple Weather state
    const simpleWeatherModule = game.modules.get('foundryvtt-simple-weather');
    const attachToCalendarSetting = simpleWeatherModule?.active ? game.settings?.get('foundryvtt-simple-weather', 'attachToCalendar') : 'N/A';
    console.log('🌉 Simple Calendar Compatibility Bridge | Simple Weather module debug:', {
        found: !!simpleWeatherModule,
        active: simpleWeatherModule?.active,
        attachSetting: attachToCalendarSetting
    });
    // Provide guidance if Simple Weather needs configuration
    if (simpleWeatherModule?.active && attachToCalendarSetting === false) {
        console.log('🌉 Simple Calendar Compatibility Bridge | Simple Weather needs "Attach to Calendar" setting enabled');
        if (game.user?.isGM) {
            ui.notifications?.info('To complete Simple Weather integration, please enable "Attach to Calendar" in Simple Weather module settings.');
        }
    }
    // Debug hook registration before our initialization
    const preInitHooks = Hooks._hooks?.['renderMainApp']?.length || 0;
    console.log('🌉 Simple Calendar Compatibility Bridge | Pre-init hook count:', preInitHooks);
    // Debug global SimpleCalendar object
    console.log('🌉 Simple Calendar Compatibility Bridge | SimpleCalendar global debug:', {
        inWindow: !!window.SimpleCalendar,
        inGlobalThis: !!globalThis.SimpleCalendar,
        windowType: typeof window.SimpleCalendar,
        globalThisType: typeof globalThis.SimpleCalendar
    });
    // Small delay to ensure Simple Weather has registered its listeners
    setTimeout(async () => {
        console.log('🌉 Simple Calendar Compatibility Bridge | Starting bridge initialization after module setup delay');
        // Check for Simple Weather hook listeners before and after our initialization
        const preInitListeners = Hooks._hooks?.['renderMainApp']?.length || 0;
        console.log('🌉 Simple Calendar Compatibility Bridge | renderMainApp hook listeners before init:', preInitListeners);
        // Check if Seasons & Stars API is already available
        if (game.seasonsStars?.api) {
            console.log('🌉 Simple Calendar Compatibility Bridge | Seasons & Stars API already available, initializing immediately');
            try {
                await compatBridge.initialize();
                // After initialization, wait for Simple Weather to register its hooks (triggered by SimpleCalendar.Hooks.Init)
                setTimeout(() => {
                    const postInitListeners = Hooks._hooks?.['renderMainApp']?.length || 0;
                    console.log('🌉 Simple Calendar Compatibility Bridge | renderMainApp hook listeners after init:', postInitListeners);
                    if (postInitListeners > preInitListeners) {
                        console.log('🌉 Simple Calendar Compatibility Bridge | Simple Weather has registered its hooks, triggering widget integration');
                        // Simple Weather has registered, now trigger the widget integration
                        compatBridge.integrateWithSeasonsStarsWidgets();
                    }
                    else {
                        console.warn('🌉 Simple Calendar Compatibility Bridge | Simple Weather has not registered renderMainApp hooks yet, trying anyway');
                        compatBridge.integrateWithSeasonsStarsWidgets();
                    }
                }, 100); // Small delay for Simple Weather to register its hooks
            }
            catch (error) {
                console.error('🌉 Simple Calendar Compatibility Bridge | Failed to initialize:', error);
                ui.notifications?.error('Simple Calendar Compatibility Bridge failed to initialize. Check console for details.');
            }
        }
        else {
            console.log('🌉 Simple Calendar Compatibility Bridge | Waiting for Seasons & Stars API...');
            // Use a polling approach to wait for the API to become available
            const startTime = Date.now();
            const maxWaitTime = 5000; // 5 seconds max wait
            const checkForAPI = () => {
                if (game.seasonsStars?.api) {
                    console.log('🌉 Simple Calendar Compatibility Bridge | Seasons & Stars API now available');
                    compatBridge.initialize().catch(error => {
                        console.error('🌉 Simple Calendar Compatibility Bridge | Failed to initialize:', error);
                        ui.notifications?.error('Simple Calendar Compatibility Bridge failed to initialize. Check console for details.');
                    });
                }
                else if (Date.now() - startTime > maxWaitTime) {
                    console.warn('🌉 Simple Calendar Compatibility Bridge | Timeout waiting for Seasons & Stars API');
                    // Try to initialize anyway - this will trigger the "no provider found" path
                    compatBridge.initialize().catch(error => {
                        console.error('🌉 Simple Calendar Compatibility Bridge | Failed to initialize:', error);
                    });
                }
                else {
                    // Check again in next frame
                    requestAnimationFrame(checkForAPI);
                }
            };
            checkForAPI();
        }
    }, 500); // Initial delay, then we'll poll for Simple Weather
});
/**
 * Module cleanup
 */
Hooks.once('destroy', () => {
    console.log('Simple Calendar Compatibility Bridge | Module shutting down');
    compatBridge?.cleanup();
});

export { SimpleCalendarCompatibilityBridge };
//# sourceMappingURL=main.js.map

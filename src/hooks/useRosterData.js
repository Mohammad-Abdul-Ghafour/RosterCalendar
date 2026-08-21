import { useState, useEffect } from "react";
import { traverseAssociationPath } from "../utils/associationUtils";
import { formatDateForXPath } from "../utils/dateUtils";
import { normalizeDayOfWeek, normalizeAvailability } from "../utils/dataUtils";

export function useRosterData(
    userIds,
    dateRange,
    patternEntityName,
    patternUserXPath,
    patternUserPath,
    patternStartDateAttr,
    patternEndDateAttr,
    patternDayEntityName,
    patternDayPatternAssociation,
    patternDayOfWeekAttr,
    patternDayAvailableAttr,
    patternDayWorkingHoursAttr,
    patternDayStartTimeAttr,
    patternDayEndTimeAttr,
    rosterDayEntityName,
    rosterDayUserXPath,
    rosterDayUserPath,
    rosterDayDateAttr,
    rosterDayTypeAttr,
    rosterDayOffStartTimeAttr,
    rosterDayOffEndTimeAttr,
    rosterDayOffHoursAttr,
    rosterDayIsPartTimeAttr,
    rosterDayWorkingHoursAttr,
    rosterDayWorkStartTimeAttr,
    rosterDayWorkEndTimeAttr
) {
    const [rosterPatterns, setRosterPatterns] = useState([]);
    const [patternDays, setPatternDays] = useState([]);
    const [rosterDays, setRosterDays] = useState([]);

    useEffect(() => {
        if (userIds.length === 0 || !window.mx) {
            setRosterPatterns([]);
            setPatternDays([]);
            setRosterDays([]);
            return;
        }

        const startDateStr = formatDateForXPath(dateRange[0]);
        const endDateStr = formatDateForXPath(dateRange[dateRange.length - 1]);

        if (patternEntityName && patternUserXPath) {
            fetchRosterPatterns(
                patternEntityName,
                patternUserXPath,
                patternUserPath,
                userIds,
                startDateStr,
                endDateStr,
                patternStartDateAttr,
                patternEndDateAttr,
                setRosterPatterns
            );
        } else {
            setRosterPatterns([]);
        }

        if (rosterDayEntityName && rosterDayUserXPath) {
            fetchRosterDays(
                rosterDayEntityName,
                rosterDayUserXPath,
                rosterDayUserPath,
                userIds,
                startDateStr,
                endDateStr,
                rosterDayDateAttr,
                rosterDayTypeAttr,
                rosterDayOffStartTimeAttr,
                rosterDayOffEndTimeAttr,
                rosterDayOffHoursAttr,
                rosterDayIsPartTimeAttr,
                rosterDayWorkingHoursAttr,
                rosterDayWorkStartTimeAttr,
                rosterDayWorkEndTimeAttr,
                setRosterDays
            );
        } else {
            setRosterDays([]);
        }
    }, [userIds, dateRange, patternEntityName, rosterDayEntityName]);

    useEffect(() => {
        if (rosterPatterns.length === 0 || !window.mx || !patternDayEntityName || !patternDayPatternAssociation) {
            setPatternDays([]);
            return;
        }

        fetchPatternDays(
            patternDayEntityName,
            patternDayPatternAssociation,
            rosterPatterns.map(p => p.id),
            patternDayOfWeekAttr,
            patternDayAvailableAttr,
            patternDayWorkingHoursAttr,
            patternDayStartTimeAttr,
            patternDayEndTimeAttr,
            setPatternDays
        );
    }, [rosterPatterns, patternDayEntityName]);

    return { rosterPatterns, patternDays, rosterDays };
}

function fetchRosterPatterns(entityName, userXPathPattern, userPath, userIds, startDate, endDate, startAttr, endAttr, setData) {
    const lastPart = userXPathPattern.substring(userXPathPattern.lastIndexOf('[') + 1);
    const userConstraint = `[${userXPathPattern} = ${userIds[0]}` +
        (userIds.length > 1 ? ` or ${userIds.slice(1).map(id => `${lastPart} = ${id}`).join(' or ')}` : '') +
        ']]';

    const xpath = `//${entityName}${userConstraint}` +
        (startAttr && endAttr ? `[${startAttr} <= '${endDate}'][${endAttr} >= '${startDate}']` : '');

    window.mx.data.get({
        xpath: xpath,
        callback: function(objs) {
            if (!userPath || objs.length === 0) {
                setData([]);
                return;
            }

            let processed = 0;
            const patterns = [];

            objs.forEach(obj => {
                traverseAssociationPath(obj, userPath, entityName, (userId) => {
                    patterns.push({
                        id: obj.getGuid(),
                        startDate: startAttr ? obj.get(startAttr) : null,
                        endDate: endAttr ? obj.get(endAttr) : null,
                        userId: userId
                    });

                    processed++;
                    if (processed === objs.length) {
                        setData(patterns);
                    }
                });
            });
        },
        error: function() {
            setData([]);
        }
    });
}

function fetchPatternDays(entityName, associationPath, patternIds, dayOfWeekAttr, availableAttr, workingHoursAttr, startTimeAttr, endTimeAttr, setData) {
    if (patternIds.length === 0) {
        setData([]);
        return;
    }

    const module = entityName.split('.')[0];
    const fullAssocName = associationPath.includes('.') ? associationPath : `${module}.${associationPath}`;
    const patternIdConstraints = patternIds.map(id => `${fullAssocName} = '${id}'`).join(' or ');
    const xpath = `//${entityName}[${patternIdConstraints}]`;

    window.mx.data.get({
        xpath: xpath,
        callback: function(objs) {
            const days = objs.map(obj => {
                const patternId = obj.get(fullAssocName);

                return {
                    id: obj.getGuid(),
                    patternId: patternId,
                    dayOfWeek: normalizeDayOfWeek(obj.get(dayOfWeekAttr || 'DayOfWeek')),
                    available: normalizeAvailability(obj.get(availableAttr || 'Available')),
                    workingHours: workingHoursAttr ? obj.get(workingHoursAttr) : null,
                    startTime: startTimeAttr ? obj.get(startTimeAttr) : null,
                    endTime: endTimeAttr ? obj.get(endTimeAttr) : null
                };
            });

            setData(days);
        },
        error: function() {
            setData([]);
        }
    });
}

function fetchRosterDays(entityName, userXPathPattern, userPath, userIds, startDate, endDate, dateAttr, typeAttr, offStartTimeAttr, offEndTimeAttr, offHoursAttr, isPartTimeAttr, workingHoursAttr, workStartTimeAttr, workEndTimeAttr, setData) {
    const lastPart = userXPathPattern.substring(userXPathPattern.lastIndexOf('[') + 1);
    const userConstraint = `[${userXPathPattern} = ${userIds[0]}` +
        (userIds.length > 1 ? ` or ${userIds.slice(1).map(id => `${lastPart} = ${id}`).join(' or ')}` : '') +
        ']]';

    const xpath = `//${entityName}${userConstraint}` +
        (dateAttr ? `[${dateAttr} >= '${startDate}'][${dateAttr} <= '${endDate}']` : '');

    window.mx.data.get({
        xpath: xpath,
        callback: function(objs) {
            if (!userPath || objs.length === 0) {
                setData([]);
                return;
            }

            let processed = 0;
            const days = [];

            objs.forEach(obj => {
                traverseAssociationPath(obj, userPath, entityName, (userId) => {
                    days.push({
                        id: obj.getGuid(),
                        userId: userId,
                        date: obj.get(dateAttr || 'Date'),
                        type: obj.get(typeAttr || 'DayType') != null ?
                            String(obj.get(typeAttr || 'DayType')) : null,
                        offStartTime: offStartTimeAttr ? obj.get(offStartTimeAttr) : null,
                        offEndTime: offEndTimeAttr ? obj.get(offEndTimeAttr) : null,
                        offHours: offHoursAttr && obj.get(offHoursAttr) != null ?
                            Number(obj.get(offHoursAttr)) : null,
                        isPartTime: isPartTimeAttr ? Boolean(obj.get(isPartTimeAttr)) : false,
                        workingHours: workingHoursAttr && obj.get(workingHoursAttr) != null ?
                            Number(obj.get(workingHoursAttr)) : null,
                        workStartTime: workStartTimeAttr ? obj.get(workStartTimeAttr) : null,
                        workEndTime: workEndTimeAttr ? obj.get(workEndTimeAttr) : null
                    });

                    processed++;
                    if (processed === objs.length) {
                        setData(days);
                    }
                });
            });
        },
        error: function() {
            setData([]);
        }
    });
}

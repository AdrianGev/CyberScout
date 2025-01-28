import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Chart from 'chart.js/auto';
import { useLocation, useNavigate } from 'react-router-dom';
import zoomPlugin from 'chartjs-plugin-zoom';
import annotationPlugin from 'chartjs-plugin-annotation';
import { addMatch } from '../store/scoutingSlice';

Chart.register(zoomPlugin);
Chart.register(annotationPlugin);

function Analysis() {
    const matches = useSelector((state) => state.scouting.matches);
    const dispatch = useDispatch();
    const [selectedTeam, setSelectedTeam] = useState('');
    const [selectedRange, setSelectedRange] = useState(null);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const compareChartRef = useRef(null);
    const compareChartInstance = useRef(null);
    const [compareTeam1, setCompareTeam1] = useState('');
    const [compareTeam2, setCompareTeam2] = useState('');
    const [matchHistory, setMatchHistory] = useState([]); // New state for match history
    const [comparisonMode, setComparisonMode] = useState('overall');
    const [specificMatch, setSpecificMatch] = useState('');
    const [pointsComparisonMode, setPointsComparisonMode] = useState('average'); // New state for points comparison
    const [csvData, setCsvData] = useState(null);
    const [csvError, setCsvError] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        console.log('Matches loaded:', matches);
        
        // Optional: Add a check for match data type
        if (matches && matches.length > 0) {
            const firstMatch = matches[0];
            console.log('First Match Structure:', {
                teamNumber: typeof firstMatch.teamNumber,
                autoPoints: typeof firstMatch.autoPoints,
                matchNumber: typeof firstMatch.matchNumber
            });
        }
    }, [matches]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const teamFromUrl = params.get('team');
        if (teamFromUrl) {
            setSelectedTeam(teamFromUrl);
            searchTeam(teamFromUrl);
        }
    }, [location]);

    const calculatePercentageChange = (start, end) => {
        if (!start || !end) return null;
        return {
            autoPoints: ((end.autoPoints - start.autoPoints) / start.autoPoints * 100).toFixed(1),
            teleopPoints: ((end.teleopPoints - start.teleopPoints) / start.teleopPoints * 100).toFixed(1),
            endgamePoints: ((end.endgamePoints - start.endgamePoints) / start.endgamePoints * 100).toFixed(1),
            totalPoints: ((end.totalPoints - start.totalPoints) / start.totalPoints * 100).toFixed(1)
        };
    };

    const updateChartAnnotations = (chart, startX, endX) => {
        if (!chart || !startX || !endX) return;

        const matchData = matches.filter(match => match.teamNumber === parseInt(selectedTeam));
        const startMatch = matchData.find(match => match.matchNumber === startX);
        const endMatch = matchData.find(match => match.matchNumber === endX);
        const percentageChanges = calculatePercentageChange(startMatch, endMatch);

        if (!percentageChanges) return;

        chart.options.plugins.annotation.annotations = {
            box1: {
                type: 'box',
                xMin: startX,
                xMax: endX,
                yMin: 0,
                yMax: 'max',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                borderColor: 'rgba(0, 0, 0, 0.25)',
                borderWidth: 1,
                label: {
                    display: true,
                    content: [
                        `Auto: ${percentageChanges.autoPoints}%`,
                        `Teleop: ${percentageChanges.teleopPoints}%`,
                        `Endgame: ${percentageChanges.endgamePoints}%`,
                        `Total: ${percentageChanges.totalPoints}%`
                    ],
                    position: 'center'
                }
            }
        };

        chart.update();
    };

    const updateChart = () => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        if (matches.length === 0) {
            // Show "no data" message
            const ctx = chartRef.current.getContext('2d');
            ctx.clearRect(0, 0, chartRef.current.width, chartRef.current.height);
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#666';
            ctx.fillText('Enter data for graph to begin', chartRef.current.width / 2, chartRef.current.height / 2);
            return;
        }

        if (!selectedTeam) {
            // Show all teams' total points
            const uniqueTeams = [...new Set(matches.map(match => match.teamNumber))];
            const datasets = uniqueTeams.map(teamNumber => {
                const teamMatches = matches
                    .filter(match => match.teamNumber === teamNumber)
                    .sort((a, b) => a.matchNumber - b.matchNumber);
                
                return {
                    label: `Team ${teamNumber}`,
                    data: teamMatches.map(match => ({
                        x: match.matchNumber,
                        y: match.totalPoints
                    })),
                    borderColor: `hsl(${(teamNumber * 137.508) % 360}, 70%, 50%)`, // Generate unique color for each team
                    backgroundColor: `hsla(${(teamNumber * 137.508) % 360}, 70%, 50%, 0.2)`,
                    tension: 0.4
                };
            });

            const ctx = chartRef.current.getContext('2d');
            chartInstance.current = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        zoom: {
                            zoom: {
                                wheel: {
                                    enabled: true,
                                    modifierKey: 'ctrl'
                                },
                                drag: {
                                    enabled: true,
                                    modifierKey: 'ctrl'
                                },
                                mode: 'x'
                            },
                            pan: {
                                enabled: true,
                                mode: 'x',
                                modifierKey: 'ctrl'
                            }
                        },
                        annotation: {
                            annotations: {}
                        },
                        legend: {
                            position: 'top'
                        },
                        title: {
                            display: true,
                            text: 'All Teams Performance'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Total Points'
                            }
                        },
                        x: {
                            type: 'linear',
                            title: {
                                display: true,
                                text: 'Match Number'
                            }
                        }
                    }
                }
            });
            return;
        }

        // Show individual team details (existing code for single team view)
        const filteredMatches = matches.filter(match => match.teamNumber === parseInt(selectedTeam));
        const matchNumbers = filteredMatches.map(match => match.matchNumber);
        const autoPoints = filteredMatches.map(match => match.autoPoints);
        const teleopPoints = filteredMatches.map(match => match.teleopPoints);
        const endgamePoints = filteredMatches.map(match => match.endgamePoints);
        const totalPoints = filteredMatches.map(match => match.totalPoints);

        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: matchNumbers,
                datasets: [
                    {
                        label: 'Auto Points',
                        data: autoPoints,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        tension: 0.4
                    },
                    {
                        label: 'Teleop Points',
                        data: teleopPoints,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        tension: 0.4
                    },
                    {
                        label: 'Endgame Points',
                        data: endgamePoints,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.4
                    },
                    {
                        label: 'Total Points',
                        data: totalPoints,
                        borderColor: 'rgba(153, 102, 255, 1)',
                        backgroundColor: 'rgba(153, 102, 255, 0.2)',
                        tension: 0.4,
                        borderDash: [5, 5]
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    zoom: {
                        zoom: {
                            wheel: {
                                enabled: true,
                                modifierKey: 'ctrl'
                            },
                            drag: {
                                enabled: true,
                                modifierKey: 'ctrl'
                            },
                            mode: 'x'
                        },
                        pan: {
                            enabled: true,
                            mode: 'x',
                            modifierKey: 'ctrl'
                        }
                    },
                    annotation: {
                        annotations: {}
                    },
                    legend: {
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: `Team ${selectedTeam} Performance`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Points'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Match Number'
                        }
                    }
                }
            }
        });
    };

    const compareTeams = () => {
        if (!compareTeam1 || !compareTeam2) {
            showAlert('Please enter both team numbers', 'warning');
            return;
        }

        const team1Matches = matches.filter(match => match.teamNumber === parseInt(compareTeam1));
        const team2Matches = matches.filter(match => match.teamNumber === parseInt(compareTeam2));

        if (team1Matches.length === 0 || team2Matches.length === 0) {
            showAlert('No matches found for one or both teams', 'warning');
            return;
        }

        // Prepare for comparison
        let comparisonData = null;
        let equalMatchesWarning = false;

        if (comparisonMode === 'overall') {
            // Check if teams have equal number of matches
            if (team1Matches.length !== team2Matches.length) {
                equalMatchesWarning = true;
            }

            // Calculate based on points comparison mode
            const calculatePoints = (matches) => {
                const totalAutoPoints = matches.reduce((sum, match) => sum + match.autoPoints, 0);
                const totalTeleopPoints = matches.reduce((sum, match) => sum + match.teleopPoints, 0);
                const totalEndgamePoints = matches.reduce((sum, match) => sum + (match.endgamePoints || 0), 0);
                const totalPoints = matches.reduce((sum, match) => sum + match.totalPoints, 0);

                return pointsComparisonMode === 'average' 
                    ? {
                        autoPoints: totalAutoPoints / matches.length,
                        teleopPoints: totalTeleopPoints / matches.length,
                        endgamePoints: totalEndgamePoints / matches.length,
                        totalPoints: totalPoints / matches.length
                    }
                    : {
                        autoPoints: totalAutoPoints,
                        teleopPoints: totalTeleopPoints,
                        endgamePoints: totalEndgamePoints,
                        totalPoints: totalPoints
                    };
            };

            // Overall points
            comparisonData = {
                team1: calculatePoints(team1Matches),
                team2: calculatePoints(team2Matches)
            };
        } else if (comparisonMode === 'specific') {
            // Specific match comparison
            const matchNumber = parseInt(specificMatch);
            const team1SpecificMatch = team1Matches.find(match => match.matchNumber === matchNumber);
            const team2SpecificMatch = team2Matches.find(match => match.matchNumber === matchNumber);

            if (!team1SpecificMatch || !team2SpecificMatch) {
                showAlert('Selected match not found for one or both teams', 'warning');
                return;
            }

            comparisonData = {
                team1: {
                    autoPoints: team1SpecificMatch.autoPoints,
                    teleopPoints: team1SpecificMatch.teleopPoints,
                    endgamePoints: team1SpecificMatch.endgamePoints || 0,
                    totalPoints: team1SpecificMatch.totalPoints
                },
                team2: {
                    autoPoints: team2SpecificMatch.autoPoints,
                    teleopPoints: team2SpecificMatch.teleopPoints,
                    endgamePoints: team2SpecificMatch.endgamePoints || 0,
                    totalPoints: team2SpecificMatch.totalPoints
                }
            };
        }

        // Destroy existing chart if it exists
        if (compareChartInstance.current) {
            compareChartInstance.current.destroy();
        }

        const ctx = compareChartRef.current.getContext('2d');
        compareChartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Auto Points', 'Teleop Points', 'Endgame Points', 'Total Points'],
                datasets: [
                    {
                        label: `Team ${compareTeam1}`,
                        data: [
                            comparisonData.team1.autoPoints,
                            comparisonData.team1.teleopPoints,
                            comparisonData.team1.endgamePoints,
                            comparisonData.team1.totalPoints
                        ],
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    },
                    {
                        label: `Team ${compareTeam2}`,
                        data: [
                            comparisonData.team2.autoPoints,
                            comparisonData.team2.teleopPoints,
                            comparisonData.team2.endgamePoints,
                            comparisonData.team2.totalPoints
                        ],
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `${pointsComparisonMode === 'average' ? 'Average' : 'Total'} Performance: Team ${compareTeam1} vs Team ${compareTeam2} ${comparisonMode === 'specific' ? `- Match ${specificMatch}` : ''}`
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} points`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: `${pointsComparisonMode === 'average' ? 'Average' : 'Total'} Points`
                        }
                    }
                }
            }
        });

        // Calculate percentage differences
        const percentageDifferences = {
            autoPoints: ((comparisonData.team2.autoPoints - comparisonData.team1.autoPoints) / comparisonData.team1.autoPoints * 100).toFixed(2),
            teleopPoints: ((comparisonData.team2.teleopPoints - comparisonData.team1.teleopPoints) / comparisonData.team1.teleopPoints * 100).toFixed(2),
            endgamePoints: ((comparisonData.team2.endgamePoints - comparisonData.team1.endgamePoints) / comparisonData.team1.endgamePoints * 100).toFixed(2),
            totalPoints: ((comparisonData.team2.totalPoints - comparisonData.team1.totalPoints) / comparisonData.team1.totalPoints * 100).toFixed(2)
        };

        // Update percentage difference display
        const percentageComparisonDiv = document.getElementById('percentageComparison');
        percentageComparisonDiv.innerHTML = `
            <div class="row">
                <div class="col-12">
                    ${equalMatchesWarning ? `
                        <div class="alert alert-warning text-center" role="alert">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            Notice: These teams haven't played an equal number of matches
                        </div>
                    ` : ''}
                    <h5 class="text-center mb-3">
                        ${pointsComparisonMode === 'average' ? 'Average' : 'Total'} Performance Difference Analysis
                        ${comparisonMode === 'specific' ? ` - Match ${specificMatch}` : ''}
                    </h5>
                </div>
                <div class="col-md-6">
                    <div class="card mb-3 ${percentageDifferences.autoPoints >= 0 ? 'border-success' : 'border-danger'}">
                        <div class="card-body text-center">
                            <h6 class="card-title">Auto Points</h6>
                            <p class="card-text display-6 ${percentageDifferences.autoPoints >= 0 ? 'text-success' : 'text-danger'}">
                                ${percentageDifferences.autoPoints}%
                                <i class="bi ${percentageDifferences.autoPoints >= 0 ? 'bi-arrow-up-circle text-success' : 'bi-arrow-down-circle text-danger'} ms-2"></i>
                            </p>
                            <small class="text-muted">Relative to Team ${compareTeam1}</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card mb-3 ${percentageDifferences.teleopPoints >= 0 ? 'border-success' : 'border-danger'}">
                        <div class="card-body text-center">
                            <h6 class="card-title">Teleop Points</h6>
                            <p class="card-text display-6 ${percentageDifferences.teleopPoints >= 0 ? 'text-success' : 'text-danger'}">
                                ${percentageDifferences.teleopPoints}%
                                <i class="bi ${percentageDifferences.teleopPoints >= 0 ? 'bi-arrow-up-circle text-success' : 'bi-arrow-down-circle text-danger'} ms-2"></i>
                            </p>
                            <small class="text-muted">Relative to Team ${compareTeam1}</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card mb-3 ${percentageDifferences.endgamePoints >= 0 ? 'border-success' : 'border-danger'}">
                        <div class="card-body text-center">
                            <h6 class="card-title">Endgame Points</h6>
                            <p class="card-text display-6 ${percentageDifferences.endgamePoints >= 0 ? 'text-success' : 'text-danger'}">
                                ${percentageDifferences.endgamePoints}%
                                <i class="bi ${percentageDifferences.endgamePoints >= 0 ? 'bi-arrow-up-circle text-success' : 'bi-arrow-down-circle text-danger'} ms-2"></i>
                            </p>
                            <small class="text-muted">Relative to Team ${compareTeam1}</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card mb-3 ${percentageDifferences.totalPoints >= 0 ? 'border-success' : 'border-danger'}">
                        <div class="card-body text-center">
                            <h6 class="card-title">Total Points</h6>
                            <p class="card-text display-6 ${percentageDifferences.totalPoints >= 0 ? 'text-success' : 'text-danger'}">
                                ${percentageDifferences.totalPoints}%
                                <i class="bi ${percentageDifferences.totalPoints >= 0 ? 'bi-arrow-up-circle text-success' : 'bi-arrow-down-circle text-danger'} ms-2"></i>
                            </p>
                            <small class="text-muted">Relative to Team ${compareTeam1}</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    const calculateMatchPoints = (match) => {
        // Auto points
        const autoCoralPoints = (
            (Number(match.autoCoralL1) * 3) +  // L1: 3pts
            (Number(match.autoCoralL2) * 4) +  // L2: 4pts
            (Number(match.autoCoralL3) * 6) +  // L3: 6pts
            (Number(match.autoCoralL4) * 7)    // L4: 7pts
        );
        const autoAlgaePoints = (
            (Number(match.autoAlgaeProcessor) * 6) + // Processor: 6pts
            (Number(match.autoAlgaeNet) * 4)        // Net: 4pts
        );
        const autoPoints = autoCoralPoints + autoAlgaePoints;

        // Teleop points
        const teleopCoralPoints = (
            (Number(match.teleopCoralL1) * 2) +  // L1: 2pts
            (Number(match.teleopCoralL2) * 3) +  // L2: 3pts
            (Number(match.teleopCoralL3) * 4) +  // L3: 4pts
            (Number(match.teleopCoralL4) * 5)    // L4: 5pts
        );
        const teleopAlgaePoints = (
            (Number(match.teleopAlgaeProcessor) * 6) + // Processor: 6pts
            (Number(match.teleopAlgaeNet) * 4)        // Net: 4pts
        );
        const teleopPoints = teleopCoralPoints + teleopAlgaePoints;

        // Endgame points
        let endgamePoints = 0;
        switch(match.endgamePosition) {
            case 'park': endgamePoints = 2; break;     // Park: 2pts
            case 'shallow': endgamePoints = 6; break;  // Shallow hang: 6pts
            case 'deep': endgamePoints = 12; break;    // Deep hang: 12pts
        }

        // Total points
        const totalPoints = autoPoints + teleopPoints + endgamePoints;

        return {
            autoPoints,
            teleopPoints,
            endgamePoints,
            totalPoints
        };
    };

    const calculateTeamRecords = (teamNumber) => {
        const teamMatches = matches.filter(match => match.teamNumber === parseInt(teamNumber));
        const records = {};

        // Get all unique teams that have matches
        const allTeams = [...new Set(matches.map(match => match.teamNumber))];
        
        // For each team, calculate win/loss record
        allTeams.forEach(opposingTeam => {
            if (opposingTeam === parseInt(teamNumber)) return; // Skip self

            const opposingTeamMatches = matches.filter(match => match.teamNumber === opposingTeam);
            let wins = 0;
            let losses = 0;
            let ties = 0;

            // Compare scores for matches with same match numbers
            teamMatches.forEach(teamMatch => {
                const opposingMatch = opposingTeamMatches.find(m => m.matchNumber === teamMatch.matchNumber);
                if (opposingMatch) {
                    if (teamMatch.totalPoints > opposingMatch.totalPoints) wins++;
                    else if (teamMatch.totalPoints < opposingMatch.totalPoints) losses++;
                    else ties++;
                }
            });

            if (wins > 0 || losses > 0 || ties > 0) {
                records[opposingTeam] = {
                    wins,
                    losses,
                    ties,
                    winPercentage: (wins + (ties * 0.5)) / (wins + losses + ties)
                };
            }
        });

        // Sort records by win percentage
        const sortedRecords = Object.entries(records)
            .sort(([,a], [,b]) => b.winPercentage - a.winPercentage)
            .map(([teamNum, record]) => ({
                teamNumber: parseInt(teamNum),
                ...record
            }));

        return {
            best: sortedRecords.slice(0, 5),
            worst: sortedRecords.reverse().slice(0, 5)
        };
    };

    const renderTeamRecords = (records) => {
        const recordsDiv = document.getElementById('teamRecords');
        if (!recordsDiv) return;

        const formatRecord = (record) => {
            return `${record.wins}-${record.losses}${record.ties > 0 ? `-${record.ties}` : ''} (${(record.winPercentage * 100).toFixed(1)}%)`;
        };

        const createRecordTable = (records, title) => {
            if (records.length === 0) return `<div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h5 class="card-title mb-0">${title}</h5>
                    </div>
                    <div class="card-body">
                        <p class="text-center mb-0">None</p>
                    </div>
                </div>
            </div>`;

            return `
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-header bg-primary text-white">
                            <h5 class="card-title mb-0">${title}</h5>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover mb-0">
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Team</th>
                                            <th>Record</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${records.map((record, index) => {
                                            let rank = index + 1;
                                            // Check if tied with previous record
                                            if (index > 0 && record.winPercentage === records[index - 1].winPercentage) {
                                                rank = "T-" + rank;
                                            }
                                            return `
                                                <tr>
                                                    <td>${rank}</td>
                                                    <td>${record.teamNumber}</td>
                                                    <td>${formatRecord(record)}</td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        };

        recordsDiv.innerHTML = `
            <div class="row mt-4">
                <div class="col-12">
                    <h4 class="text-center mb-3">Team Records</h4>
                </div>
                ${createRecordTable(records.best, 'Best Records')}
                ${createRecordTable(records.worst, 'Worst Records')}
            </div>
        `;
    };

    const searchTeam = (teamNumber = null) => {
        const searchValue = teamNumber || selectedTeam;
        
        // Add logging to understand what's happening
        console.log('Search Value:', searchValue);
        console.log('All Matches:', matches);
        console.log('Selected Team:', selectedTeam);

        if (!searchValue) {
            showAlert('Please enter a team number', 'warning');
            return;
        }

        // Ensure searchValue is converted to a number
        const teamNumberToSearch = parseInt(searchValue, 10);
        console.log('Parsed Team Number:', teamNumberToSearch);

        const teamMatches = matches.filter(match => {
            console.log('Comparing:', match.teamNumber, 'with', teamNumberToSearch);
            return match.teamNumber === teamNumberToSearch;
        });

        console.log('Filtered Matches:', teamMatches);

        if (teamMatches.length === 0) {
            showAlert('No matches found for this team', 'warning');
            setMatchHistory([]);
            return;
        }

        updateChart();
        setMatchHistory(teamMatches);
        
        // Calculate and display team records
        const records = calculateTeamRecords(teamNumberToSearch);
        renderTeamRecords(records);
    };

    const clearData = () => {
        setSelectedTeam('');
        setSelectedRange(null);
        setMatchHistory([]); // Clear match history state
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
    };

    const exportData = () => {
        if (!selectedTeam) {
            showAlert('Please select a team first', 'warning');
            return;
        }

        const teamMatches = matches.filter(match => match.teamNumber === parseInt(selectedTeam));
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Match,Auto,Teleop,Endgame,Total\n"
            + teamMatches.map(match => 
                `${match.matchNumber},${match.autoPoints},${match.teleopPoints},${match.endgamePoints || 0},${match.totalPoints}`
            ).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `team${selectedTeam}_data.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCSVImport = (event) => {
        const file = event.target.files[0];
        setCsvError(null);
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    console.log('Raw text:', text); // Debug log
                    
                    // Split into rows and filter out empty rows
                    const rows = text.split('\n')
                        .map(row => row.trim())
                        .filter(row => row);
                    
                    console.log('Rows:', rows); // Debug log
                    
                    // Process each row into a match object
                    const matches = rows.map((row, index) => {
                        // Try to detect the delimiter (tab or comma)
                        const delimiter = row.includes('\t') ? '\t' : ',';
                        const values = row.split(delimiter).map(v => v.trim());
                        console.log(`Row ${index} values:`, values); // Debug log
                        
                        // Create the base match object
                        const match = {
                            matchNumber: parseInt(values[0]) || 0,
                            teamNumber: parseInt(values[1]) || 0,
                            startingPosition: values[2] || '',
                            autoStop: values[3] === '1',
                            eStop: values[4] === '1',
                            hitOpponentCage: values[5] === '1',
                            crossedOpponentSide: values[6] === '1',
                            movedInAuto: values[7] === '1',
                            autoCoralL1: parseInt(values[8]) || 0,
                            autoCoralL2: parseInt(values[9]) || 0,
                            autoCoralL3: parseInt(values[10]) || 0,
                            autoCoralL4: parseInt(values[11]) || 0,
                            autoAlgaeProcessor: parseInt(values[12]) || 0,
                            autoAlgaeNet: parseInt(values[13]) || 0,
                            autoNotes: values[14] || '',
                            teleopCoralL1: parseInt(values[15]) || 0,
                            teleopCoralL2: parseInt(values[16]) || 0,
                            teleopCoralL3: parseInt(values[17]) || 0,
                            teleopCoralL4: parseInt(values[18]) || 0,
                            teleopAlgaeProcessor: parseInt(values[19]) || 0,
                            teleopAlgaeNet: parseInt(values[20]) || 0,
                            teleopNotes: values[21] || '',
                            teleopTotalPoints: parseInt(values[22]) || 0,
                            endgamePosition: values[23] || '',
                            endgameTotalPoints: parseInt(values[24]) || 0
                        };

                        // Validate essential fields
                        if (!match.matchNumber || !match.teamNumber) {
                            throw new Error(`Row ${index + 1}: Invalid match number or team number`);
                        }

                        // Calculate points
                        const points = calculateMatchPoints(match);
                        return {
                            ...match,
                            ...points
                        };
                    });

                    console.log('Processed matches:', matches);
                    
                    // Store the matches in state and Redux
                    setCsvData(matches);
                    setCsvError(null);
                    matches.forEach(match => {
                        dispatch(addMatch(match));
                    });

                } catch (error) {
                    console.error('Import error:', error);
                    setCsvError(error.message);
                    setCsvData(null);
                }
            };
            reader.onerror = () => {
                setCsvError('Failed to read file');
                setCsvData(null);
            };
            reader.readAsText(file);
        }
    };

    const validateCSVFormat = (data) => {
        // Check if we have any data
        if (!data || data.length === 0) {
            return { isValid: false, error: 'CSV file is empty' };
        }

        // Basic data validation for each row
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            
            // Check if match number and team number are present and are numbers
            if (!row.matchNumber || !row.teamNumber || isNaN(Number(row.matchNumber)) || isNaN(Number(row.teamNumber))) {
                return {
                    isValid: false,
                    error: `Row ${i + 1}: Match number and team number must be valid numbers`
                };
            }

            // Check if starting position is present
            if (!row.startingPosition) {
                return {
                    isValid: false,
                    error: `Row ${i + 1}: Starting position is required`
                };
            }
        }

        return { isValid: true };
    };

    const showAlert = (message, type) => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.querySelector('.container').insertBefore(alertDiv, document.querySelector('.card'));
        setTimeout(() => alertDiv.remove(), 3000);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="row">
                <div className="col-12">
                    <div className="text-center mb-4">
                        <h2 className="display-5 mb-3">Team Performance Analysis</h2>
                        <p className="lead">Analyze team statistics and performance trends</p>
                        <p className="text-muted">
                            <i className="bi bi-info-circle me-2"></i>
                            Drag across the chart to see percentage changes between matches. 
                            Use Ctrl + Wheel to zoom, Ctrl + Drag to pan.
                        </p>
                        <button 
                            className="btn btn-primary btn-lg mt-2"
                            onClick={() => navigate('/scout')}
                        >
                            <i className="bi bi-plus-circle me-2"></i>
                            Scout New Match
                        </button>
                        <div className="mt-2">
                            <input
                                id="csvInput"
                                type="file"
                                accept=".csv"
                                onChange={handleCSVImport}
                                style={{ display: 'none' }}
                            />
                            <button 
                                className="btn btn-success btn-lg"
                                onClick={() => document.getElementById('csvInput').click()}
                            >
                                <i className="bi bi-file-earmark-spreadsheet me-2"></i>
                                Import CSV Data
                            </button>
                            {csvData && (
                                <div className="mt-2 text-success">
                                    <i className="bi bi-check-circle me-2"></i>
                                    CSV file imported successfully! ({csvData.length} matches loaded)
                                </div>
                            )}
                            {csvError && (
                                <div className="mt-2 text-danger">
                                    <i className="bi bi-exclamation-triangle me-2"></i>
                                    {csvError}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Team Search Section */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0"><i className="bi bi-search me-2"></i>Team Search</h5>
                        </div>
                        <div className="card-body">
                            <div className="row mb-3">
                                <div className="col-md-8">
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="Enter Team Number" 
                                        value={selectedTeam}
                                        onChange={(e) => setSelectedTeam(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <div className="btn-group w-100">
                                        <button 
                                            className="btn btn-primary" 
                                            onClick={() => searchTeam()}
                                        >
                                            <i className="bi bi-search me-2"></i>Search
                                        </button>
                                        <button 
                                            className="btn btn-secondary" 
                                            onClick={clearData}
                                        >
                                            <i className="bi bi-x-circle me-2"></i>Clear
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Match History Section */}
                    <div className="card mb-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0"><i className="bi bi-table me-2"></i>Match History</h5>
                            {matchHistory.length > 0 && (
                                <button 
                                    className="btn btn-outline-primary btn-sm" 
                                    onClick={exportData}
                                >
                                    <i className="bi bi-download me-2"></i>Export
                                </button>
                            )}
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-striped table-hover">
                                    <thead>
                                        <tr>
                                            <th>Match</th>
                                            <th>Auto</th>
                                            <th>Teleop</th>
                                            <th>Endgame</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {matchHistory.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="text-center text-muted">
                                                    <i className="bi bi-search me-2"></i>
                                                    {selectedTeam 
                                                        ? `No matches found for Team ${selectedTeam}` 
                                                        : 'Select a team to view match history'}
                                                </td>
                                            </tr>
                                        ) : (
                                            matchHistory.map((match, index) => (
                                                <tr key={index}>
                                                    <td>{match.matchNumber}</td>
                                                    <td>{match.autoPoints}</td>
                                                    <td>{match.teleopPoints}</td>
                                                    <td>{match.endgamePoints || 0}</td>
                                                    <td>{match.totalPoints}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="my-4" style={{
                        height: '2px', 
                        backgroundColor: '#495057', 
                        width: '100%'
                    }}></div>

                    {/* Team Comparison Section */}
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0"><i className="bi bi-graph-up me-2"></i>Team Comparison</h5>
                        </div>
                        <div className="card-body">
                            <div className="row mb-3">
                                <div className="col-6">
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="Team 1 Number" 
                                        value={compareTeam1}
                                        onChange={(e) => setCompareTeam1(e.target.value)}
                                    />
                                </div>
                                <div className="col-6">
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="Team 2 Number" 
                                        value={compareTeam2}
                                        onChange={(e) => setCompareTeam2(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="row mb-3">
                                <div className="col-6">
                                    <select 
                                        className="form-select" 
                                        value={comparisonMode}
                                        onChange={(e) => setComparisonMode(e.target.value)}
                                    >
                                        <option value="overall">Overall Comparison</option>
                                        <option value="specific">Specific Match</option>
                                    </select>
                                </div>
                                <div className="col-6">
                                    <select 
                                        className="form-select" 
                                        value={pointsComparisonMode}
                                        onChange={(e) => setPointsComparisonMode(e.target.value)}
                                    >
                                        <option value="average">Compare Average Points</option>
                                        <option value="total">Compare Total Points</option>
                                    </select>
                                </div>
                            </div>

                            {comparisonMode === 'specific' && (
                                <div className="row mb-3">
                                    <div className="col-12">
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="Enter Specific Match Number" 
                                            value={specificMatch}
                                            onChange={(e) => setSpecificMatch(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="row">
                                <div className="col-12">
                                    <button 
                                        className="btn btn-primary w-100" 
                                        onClick={compareTeams}
                                    >
                                        <i className="bi bi-bar-chart-line me-2"></i>Compare Teams
                                    </button>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-12">
                                    <canvas ref={compareChartRef} height="100"></canvas>
                                </div>
                            </div>

                            <div id="percentageComparison" className="mt-4"></div>
                        </div>
                    </div>

                    {/* Performance Metrics Section */}
                    {selectedTeam && (
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0"><i className="bi bi-graph-up me-2"></i>Performance Metrics for Team {selectedTeam}</h5>
                            </div>
                            <div className="card-body">
                                <canvas ref={chartRef}></canvas>
                            </div>
                        </div>
                    )}
                    {/* Team Records Section */}
                    <div id="teamRecords" className="container-fluid mt-4"></div>
                </div>
            </div>
        </div>
    );
}

export default Analysis;
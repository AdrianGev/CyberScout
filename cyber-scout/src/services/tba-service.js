import { TBA_API_BASE_URL, TBA_API_KEY } from '../config/tba-config';

class TBAService {
  constructor() {
    this.baseUrl = TBA_API_BASE_URL;
    this.headers = {
      'X-TBA-Auth-Key': TBA_API_KEY,
    };
  }

  async getDistricts(year) {
    const response = await fetch(`${this.baseUrl}/districts/${year}`, {
      headers: this.headers,
    });
    if (!response.ok) throw new Error('Failed to fetch districts');
    return response.json();
  }

  async getDistrictEvents(districtKey) {
    const response = await fetch(`${this.baseUrl}/district/${districtKey}/events`, {
      headers: this.headers,
    });
    if (!response.ok) throw new Error('Failed to fetch district events');
    return response.json();
  }

  async getTeamEvents(teamNumber, year) {
    const response = await fetch(`${this.baseUrl}/team/frc${teamNumber}/events/${year}`, {
      headers: this.headers,
    });
    if (!response.ok) throw new Error('Failed to fetch team events');
    return response.json();
  }

  async getEventMatches(eventKey) {
    const response = await fetch(`${this.baseUrl}/event/${eventKey}/matches`, {
      headers: this.headers,
    });
    if (!response.ok) throw new Error('Failed to fetch event matches');
    return response.json();
  }

  async getMatch(matchKey) {
    const response = await fetch(`${this.baseUrl}/match/${matchKey}`, {
      headers: this.headers,
    });
    if (!response.ok) throw new Error('Failed to fetch match');
    return response.json();
  }

  // Get team position in a match (red1, red2, red3, blue1, blue2, blue3)
  getTeamPositionInMatch(match, teamNumber) {
    if (!match || !match.alliances) return null;

    const positions = {
      red: ['red1', 'red2', 'red3'],
      blue: ['blue1', 'blue2', 'blue3']
    };

    for (const alliance of ['red', 'blue']) {
      const teamList = match.alliances[alliance].team_keys;
      for (let i = 0; i < teamList.length; i++) {
        if (teamList[i] === `frc${teamNumber}`) {
          return positions[alliance][i];
        }
      }
    }
    return null;
  }
}

export const tbaService = new TBAService();

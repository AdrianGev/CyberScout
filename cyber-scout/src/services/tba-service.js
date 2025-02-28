import { TBA_API_BASE_URL, TBA_API_KEY } from '../config/tba-config';

class TBAService {
  constructor() {
    this.baseUrl = TBA_API_BASE_URL;
    this.headers = {
      'X-TBA-Auth-Key': TBA_API_KEY || '', // Handle case where API key is not available
    };
  }

  async getDistricts(year) {
    try {
      if (!TBA_API_KEY) {
        console.warn('TBA API key not found. Some features may be limited.');
        return [];
      }
      const response = await fetch(`${this.baseUrl}/districts/${year}`, {
        headers: this.headers,
      });
      if (!response.ok) throw new Error('Failed to fetch districts');
      return response.json();
    } catch (error) {
      console.error('Error fetching districts:', error);
      return [];
    }
  }

  async getDistrictEvents(districtKey) {
    try {
      if (!TBA_API_KEY) {
        console.warn('TBA API key not found. Some features may be limited.');
        return [];
      }
      const response = await fetch(`${this.baseUrl}/district/${districtKey}/events`, {
        headers: this.headers,
      });
      if (!response.ok) throw new Error('Failed to fetch district events');
      return response.json();
    } catch (error) {
      console.error('Error fetching district events:', error);
      return [];
    }
  }

  async getTeamEvents(teamNumber, year) {
    try {
      if (!TBA_API_KEY) {
        console.warn('TBA API key not found. Some features may be limited.');
        return [];
      }
      const response = await fetch(`${this.baseUrl}/team/frc${teamNumber}/events/${year}`, {
        headers: this.headers,
      });
      if (!response.ok) throw new Error('Failed to fetch team events');
      return response.json();
    } catch (error) {
      console.error('Error fetching team events:', error);
      return [];
    }
  }

  async getEventMatches(eventKey) {
    try {
      if (!TBA_API_KEY) {
        console.warn('TBA API key not found. Some features may be limited.');
        return [];
      }
      const response = await fetch(`${this.baseUrl}/event/${eventKey}/matches`, {
        headers: this.headers,
      });
      if (!response.ok) throw new Error('Failed to fetch event matches');
      return response.json();
    } catch (error) {
      console.error('Error fetching event matches:', error);
      return [];
    }
  }

  async getMatch(matchKey) {
    try {
      if (!TBA_API_KEY) {
        console.warn('TBA API key not found. Some features may be limited.');
        return [];
      }
      const response = await fetch(`${this.baseUrl}/match/${matchKey}`, {
        headers: this.headers,
      });
      if (!response.ok) throw new Error('Failed to fetch match');
      return response.json();
    } catch (error) {
      console.error('Error fetching match:', error);
      return [];
    }
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

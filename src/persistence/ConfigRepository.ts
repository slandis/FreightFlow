import difficultyModes from "../data/config/difficultyModes.json";
import freightClasses from "../data/config/freightClasses.json";
import laborRoles from "../data/config/laborRoles.json";
import zoneTypes from "../data/config/zoneTypes.json";

export class ConfigRepository {
  getFreightClasses() {
    return freightClasses;
  }

  getZoneTypes() {
    return zoneTypes;
  }

  getLaborRoles() {
    return laborRoles;
  }

  getDifficultyModes() {
    return difficultyModes;
  }
}

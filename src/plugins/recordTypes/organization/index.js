import advancedSearch from './advancedSearch';
import fields from './fields';
import forms from './forms';
import optionLists from './optionLists';
import vocabularies from './vocabularies';

export default () => (configContext) => ({
  optionLists,
  recordTypes: {
    organization: {
      advancedSearch: advancedSearch(configContext),
      fields: fields(configContext),
      forms: forms(configContext),
      vocabularies,
    },
  },
});

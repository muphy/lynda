angular.module('starter.session.services', ['$localstorage'])

	.factory('ProgramService', function ($localstorage,$cacheFactory) {

    return {
		saveSession: function (profile) {
			$localstorage.setObject('me',profile);
			$cacheFactory.set('me',profile);
		},
		login: function (provider) {
			return login(provider);
		},
		logout: function (provider) {
			return logout(provider);
		},
		hasSession: function () {
			var hasSession = this.getUserProfile() != null;
			return hasSession;
		},
		getUserProfile: function () {
			var keyName = 'firebase:session::sizzling-heat-271';
			var profile = $localstorage.getObject(keyName);
			return profile ? profile.facebook.cachedUserProfile : null;
		},
		getUserId: function () {
			return self.userId;
		},
		getUserProfileImage: function () {
			var userProfile = this.getUserProfile();
			return userProfile ? userProfile.picture.data.url : null;
		}
	}
});
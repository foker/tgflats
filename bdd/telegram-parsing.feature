Feature: Telegram Channel Parsing
  As a system administrator
  I want to automatically parse Telegram channels
  So that rental listings are collected without manual intervention

  Background:
    Given the system has configured Telegram API credentials
    And the following channels are monitored:
      | channel_name         | channel_id    | language |
      | tbilisi_rentals     | @tbilisi_rent | en       |
      | batumi_apartments   | @batumi_apt   | ge       |
      | georgia_realty      | @geo_realty   | ru       |

  Scenario: Successfully parse new posts from channel
    Given the channel "tbilisi_rentals" has 5 new posts
    When the parsing job runs
    Then 5 TelegramPost entities should be created
    And each post should contain:
      | field          | requirement                |
      | text           | not empty                  |
      | channel_id     | matches source channel     |
      | message_id     | unique within channel      |
      | created_at     | timestamp from Telegram    |
      | raw_data       | complete message object    |
    And the posts should be queued for AI analysis

  Scenario: Handle posts with media attachments
    Given a new post contains:
      | media_type | count |
      | photo      | 3     |
      | video      | 1     |
    When the post is parsed
    Then the media should be downloaded and stored
    And media URLs should be saved in the TelegramPost entity
    And original media should be backed up to object storage

  Scenario: Skip already parsed messages
    Given the channel has posts with message_ids [100, 101, 102]
    And posts 100 and 101 are already in the database
    When the parsing job runs
    Then only post 102 should be processed
    And no duplicate TelegramPost entities should be created

  Scenario: Handle parsing errors gracefully
    Given the Telegram API is temporarily unavailable
    When the parsing job runs
    Then the job should be retried with exponential backoff
    And an alert should be sent after 3 failed attempts
    And the job should be marked as failed after 5 attempts

  Scenario: Parse edited messages
    Given a post with message_id 100 exists in the database
    And the post was edited in Telegram
    When the parsing job runs
    Then the existing TelegramPost should be updated
    And the edit history should be preserved
    And the post should be re-queued for AI analysis

  Scenario: Handle rate limiting
    Given the Telegram API rate limit is 30 requests per second
    When parsing multiple channels simultaneously
    Then requests should be throttled to stay within limits
    And a queue should manage pending requests
    And high-priority channels should be processed first

  Scenario: Channel becomes unavailable
    Given the channel "test_channel" was previously accessible
    When the channel becomes private or deleted
    Then the parsing job should log the error
    And the channel should be marked as inactive
    And an admin notification should be sent

  Scenario: Parse forwarded messages
    Given a post is forwarded from another channel
    When the post is parsed
    Then both original and forwarded channel info should be stored
    And the forward chain should be preserved
    And duplicate detection should check original source
